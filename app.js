const express = require('express')
const got = require("got");
const geolib = require("geolib");
const childProcess = require("child_process");
const fs = require('fs');
const download = require('download');


const getFeedList = async () => {
  const info = await got("https://api.tfl.gov.uk/Place/Type/JamCam/?app_id=a20e2f12&app_key=732436bb1747a061ed9ec411023b9315", { json: true });
  return info;
};

const findFeed = (feedList) => {
  return feedList.filter(feed => feed.id === "JamCams_00001.09726")[0];
}

const findClosestFeed = (inputCoordRange, feedList, searchRadiusInM = 50) => {
  const centerCoords = geolib.getCenter(inputCoordRange);
  const closestfeedList = feedList.filter(feed => {
    const distanceBetweenInputAndCamera = geolib.getDistance({latitude: feed.lat, longitude:feed.lon}, centerCoords);
     return distanceBetweenInputAndCamera < searchRadiusInM
    });
  return closestfeedList[0];
};

const getFeatureCoordRange = async () => {
  return [{ latitude: 51.6001, longitude: -0.01594 }, { latitude: 51.6006, longitude: -0.01594 }];
}

const app = express();

const getTakenUpParkingSpaceInM = (featureCoordRange) => {
  return new Promise((resolve, reject) => {
    try{
      const pythonProcess = childProcess.spawn('python',["script.py"]);
      pythonProcess.stdout.on('data', (data) => {
        const {cars, minivans} = JSON.parse(data);
        const spaceTakenUpInM = cars * 4.5 + minivans * 6.7
        resolve(spaceTakenUpInM)
      });
    } catch (err){
      reject(err);
    }
  })
};

app.get('/api/feature/:featureid/space-probability', async (req, res) => {
  const {featureid} = req.params;
  const featureCoordRange = await getFeatureCoordRange(featureid);
  const { body: allCameraFeeds} = await getFeedList();
  const closestFeed = await findClosestFeed(featureCoordRange, allCameraFeeds);
  const feedImageUrl = closestFeed.additionalProperties.filter(props => props.key === "imageUrl")[0].value;
  const lengthOfFeature = geolib.getDistance(...featureCoordRange);
  const isImageSaved = await download(feedImageUrl).then((data)=> fs.writeFileSync('road.jpg', data));
  console.log(isImageSaved);
  const spaceTakenUpInM = await getTakenUpParkingSpaceInM(featureCoordRange);
  const remainingLengthInFeature = lengthOfFeature-spaceTakenUpInM;
  const remainingSpaces = Math.floor(remainingLengthInFeature/4.5);
  res.status(200).json({remainingSpaces, lengthOfFeature, spaceTakenUpInM});
})

app.use((req,res) => {
  res.status(404).send("404")
})


app.listen(3000);

module.exports = app;
