var request = require('request');
var cheerio = require('cheerio');
var Entities = require('html-entities').XmlEntities;
const entities = new Entities();


var TripHobo = function() {
  var trips = [];

  var printTrips = function() {
    console.log(JSON.stringify(trips));
  }

  /*
   * Public: Gets random recent trips
   * @param count: Number of pages to fetch
   */
  var getRecent = function(pages) {
    count = typeof pages === 'undefined' ? 1 : pages;
    for(var i=0;i<count;i++) {
      // Recent
      // var url = 'https://www.triphobo.com/itineraries/showmore/recent/'+(count+1)+'/?format=json';
      // New Orleans
      // var url = "https://www.triphobo.com/itineraries/searchshowmore/new-orleans/recent/"+count+"/1-70/itinsearch59177d7d3939b8.22488513";
      // Vancouver
      var url = "https://www.triphobo.com/itineraries/searchshowmore/vancouver/recent/"+count+"/1-70/itinsearch59178230c1dc56.20239419";
      // Hawaii
      // var url = "https://www.triphobo.com/itineraries/searchshowmore/hawaii/recent/"+count+"/1-70/itinsearch5917881f72fa66.56001845";
      if(i == (count-1)) {
        fetchTripList(url,function() {

          setTimeout(function() {
            printTrips();
          },30000);

        });
      }
      else {
        fetchTripList(url,function(){});
      }
    }
  }

  /*
   * Public: Gets trip by city name
   * @param count: Number of pages to fetch
   */
  var getByCity= function(city,pages) {
    // Replace spaces with dashes
    search = city.replace(/ /g,"-");
    search += "-city";
    count = typeof pages === 'undefined' ? 1 : pages;
    for(var i=0;i<count;i++) {
      var url = 'https://www.triphobo.com/itineraries/showmore/recent/'+(count+1)+'/?format=json';
      var url = "https://www.triphobo.com/itineraries/searchshowmore/"
        + search + "/popular/"+count+"/1-100/itinsearch59176ac83333e1.95404938";

      if(i == (count-1)) {
        fetchTripList(url,function() {
          console.log("Found " + trips.length + " trips.");
          console.log("Last trip:");
          console.log(trips[trips.length-1]);
        });
      }
      else {
        fetchTripList(url,function(){});
      }
    }
  }

  /*
   * Private: Gets a list of trips from given url
   */
  var fetchTripList = function(url,callback) {
    request(url, function(error, response, data){
      if(!error){
        parseList(data);
      }
      callback();
    });
  }
  /*
   * Private: Parse JSON response from TripHobo
   */
  var parseList = function(data,callback) {
    json = JSON.parse(data);
    // Decode html entities
    var html = entities.decode(json.html);
    // Replace escaped doube quotes \" > "
    html = html.replace(/\\"/g, "\"");
    var $ = cheerio.load(html);


    $('.itinerary-list').filter(function() {
      $(this).children().each(function(i, elm) {
        var trip = {
          name: "",
          time: "",
          cost: "",
          img: "",
          itinerary: ""
        };
        var tripCost = $(this).find(".tripcost-budget label").text().trim();
        if(tripCost !== "") {
          trip.cost = tripCost;
          trip.time = $(this).find(".blocklist-total-days").text();
          trip.name = $(this).find("div.blocklist-trip-name").text().trim();
          // Clean up trip name
          if(trip.name.indexOf("Trip to ") > 0) {
            trip.name = trip.name.slice(
              trip.name.indexOf("Trip to ")+8,
              trip.name.indexOf(" from "));
          }
          if(trip.name.indexOf("Itinerary ") > 0) {
            trip.name = trip.name.slice(
              0,
              trip.name.indexOf(" Itinerary "));
          }
          trip.img  = $(this).find("img").first().attr("data-src");
          trips.push(trip);
          addItinerary(trips.length-1,$(this).find(".blocklist-trip-name-wrapper a")
            .first().attr("href"));
        }
      });
    });
  }

  var addItinerary = function(index,url) {
    request(url, function(error, response, data){
      if(!error){
        trips[index].itinerary = parseItinerary(data);
      }
      return {}; //empty set
    });

  }

  /*
   * Public: Get Itinerary
   */
  var getItinerary = function(url) {
    request(url, function(error, response, data){
      if(!error){
        return parseItinerary(data);
      }
      return {}; //empty set
    });
  };

  /*
   * Private: Parse Itineary detes
   */
  var parseItinerary = function(html) {
    var itinerary = {
      poi:[],
      days:[]
    };

    var $ = cheerio.load(html);

    $("#js_day_container").filter(function() {
      $(this).children().each(function(i, elm) {
        var day = {
          city: "",
          events: []
        };
        day.city = $(this).find("#js_day_cities").text();
        $("ul.day_scroll").filter(function() {
          $(this).children().each(function(i, elm) {
            var name = $(this).find(".step-2-attraction-name").text();
            var thumbnail = $(this).find(".step-2-added-attraction-wrapper img")
              .first().attr("data-src");
            thumbnail = typeof thumbnail === 'undefined' ? "" : thumbnail;

            day.events.push({
              name: name,
              startTime: $(this).find(".attraction-start-time span").text(),
              thumbnail: thumbnail,
            });
            if(thumbnail !== ""){
              if(thumbnail.indexOf("airport") == -1) {
                if(thumbnail.indexOf("hotel") == -1) {
                  if(name.indexOf("Airport") == -1) {
                    if(name.indexOf("Historic") == -1) {
                      itinerary.poi.push(name);
                    }
                  }
                }
              }
            }
          });
        });

        itinerary.days.push(day);
      });
    });

    return itinerary;
  }

  return {
    getRecent: getRecent,
    getByCity: getByCity,
    getItinerary: getItinerary
  }

}

var tripHobo = TripHobo();
tripHobo.getRecent(5);
// tripHobo.getByCity("New York",3);
// tripHobo.getItinerary('https://www.triphobo.com/tripplans/buffalo-newark-washington-d-c-itinerary-from-minneapolis-58f2d9e14b7406978a000212');


