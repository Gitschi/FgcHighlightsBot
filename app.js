var Twit = require('twit');
var env = require("./env"); // Imports API keys
var T = new Twit(env.keys); // Uses keys as argument and creates object
var tweetArray = []; // Will hold our relevant tweets

// Keywords that the code will look for
var keywordArray = [
  '#FGC', '#格ゲー', '#SFVAE', '#StreetFighter', '#Tekken7', '#Tekken',
  '#SC6', '#SCVI', '#SoulCalibur', '#KillerInstinct', '#DBFZ',
  '#FEXL', '#SSBU', '#SmashBrosUltimate', '#GGXRD', '#GuiltyGear'
]
var getAmount = 100; // Sets how many results will be returned upon search
var intervalTime = 30 * 60 * 1000; // first number will define minutes

// Starts the process every N miliseconds
setInterval(startProcess, intervalTime);

function startProcess(){
  tweetArray = [];
  // Passes on search terms and starts process
  for(let i = 0; i < keywordArray.length; i++){
    GetTweets(keywordArray[i]);
  }

  // retweets after N time has passed
  setTimeout(function() {
    retweetPost(); 
  }, 10000);
}

// Gets tweets and pushes the relevant ones into an array
function GetTweets(searchTerm){
  T.get('search/tweets', { q: searchTerm, count: getAmount }, function(err, data, response) {
    var currentTime = getCurrentTime();

    for(let i = 0; i < data.statuses.length; i++){
      if(checkOriginality(data.statuses[i])){
        var score;
        var postTime = checkTime(data.statuses[i].created_at);
        var lifeTime = ((currentTime - postTime) / (60 * 1000)).toFixed(2); // Gets lifetime in minutes
        score = calcScore(data.statuses[i].retweet_count, data.statuses[i].favorite_count);
  
        // Only use tweets that are older than 30 mins and younger than 90 mins
        if(lifeTime >= 31 && lifeTime <= 30 + (intervalTime / 60000)){
          tweetArray.push(
            {"username": data.statuses[i].user.name, "id": data.statuses[i].id_str, "score": score, "lifeTime": lifeTime}
          );
        }
      }
    }
    // Sorts the array in a descending order
    tweetArray.sort(function (a, b) {
      return b.score - a.score;
    });
  })
}

// retweets post with hightest score
function retweetPost(){
    topTweetId = {id: tweetArray[0].id}

  T.post('statuses/retweet/:id', topTweetId, function (err, data, response) {
    if(err){
      console.log(err)
    }
    else{
      console.log("Retweeted " + tweetArray[0].username + "'s post with id: " + tweetArray[0].id + " and score of " + tweetArray[0].score)
    }
  }) 
  T.post('favorites/create', topTweetId, function (err, data, response) {
    if(err){
      console.log(err);
    }
  }) 
}

// Checks that tweet is not a retweet, quote or reply
function checkOriginality(tweet){
  var isOriginal = false;
  if(!tweet.retweeted_status && !tweet.is_quote_status && tweet.in_reply_to_status_id === null){
    isOriginal = true;
  }
  else{
    console.log(tweet.user.name + "'s tweet with id: " + tweet.id_str + " is not original.")
  }
  return isOriginal;
}

// Gets current time
function getCurrentTime(){
  var today = new Date();
  return today.getTime();
}

// Converts tweet creation time to milliseconds
function checkTime(created){
  created = new Date (created);
  return created.getTime();
}

// Calculates score
function calcScore(rt, fav){
  return ((rt * 2) + fav)
}