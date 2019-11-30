const got = require("got");
const geolib = require("geolib");


const getFeedList = async () => {
  const info = await got("https://api.tfl.gov.uk/Place/Type/JamCam/?app_id=a20e2f12&app_key=732436bb1747a061ed9ec411023b9315", { json: true });
  return info;
};

const findFeed = (feedList) => {
  return feedList.filter(feed => feed.id === "JamCams_00001.09726")[0];
}

const findClosestFeeds = (inputCoordRange, feedList, searchRadiusInM = 500) => {
  const centerCoords = geolib.getCenter(inputCoordRange);
  console.log(feedList[0]);
  const closestfeedList = feedList.filter(feed => {
    const distanceBetweenInputAndCamera = geolib.getDistance({latitude: feed.lat, longitude:feed.lon}, centerCoords);
     return distanceBetweenInputAndCamera < searchRadiusInM}
    );
  console.log(closestfeedList);
};

getFeedList().then( ({body: feedList}) => {
  const feed = findFeed(feedList);
  // console.log(feed);
  const closestFeeds = findClosestFeeds([{ latitude: 51.6007, longitude: -0.01594 }, { latitude: 51.6007, longitude: -0.01594 }],feedList);
  const feedImage = feed.additionalProperties.filter(props => props.key === "imageUrl")[0];
  const feedVideo = feed.additionalProperties.filter(props => props.key === "videoUrl")[0];
  console.log(feedImage.value, feedVideo.value);
});