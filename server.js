var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var request = require('request');



// Get index Page.
var idx_data = fs.readFileSync('index.html','utf-8');

// Express Usage
var app = express();
app.use(bodyParser.json());   
app.use('/static', express.static('public'));
app.use(cookieParser());
app.use(expressSession({secret:'omfgsecretvalveslol'}));

// Routing Handlers
app.get('/',function(req,res){
    res.send(idx_data);
});
app.post('/',function(req,res){

    get_fmf_data(req.body,res);
});


//Invoke Server
var server=app.listen(80,function(){
    console.log("Server Started!");
});


function get_fmf_data(userData,res,callback_fmf){
    var prsID = userData['prsID']
    var deviceUDID = "";//userData['deviceUDID']
    var mmeFMFAuthToken = userData['mmeFMFAuthToken']
    var encodedAuth = new Buffer(prsID+":"+mmeFMFAuthToken).toString('base64')
    
    var requestData = {
        "clientContext":
            {
                "productType":"iPhone7,1",
                "isAppRestricted":false,
                "osVersion":"9.0.2",
                "lastLoggedInPrsId":prsID,
                "appPushModeAllowed":false,
                "deviceClass":"iPhone",
                "currentTime":Date.now() / 1000 | 0,
                "appName":"FindMyFriends",
                "deviceUDID":deviceUDID,
                "appVersion":"5.0",
                "pushMode":true,
                "userInactivityTimeInMS":0
            }
        };


    var options = {
      url: 'https://p06-fmfmobile.icloud.com/fmipservice/friends/'+prsID+'/'+deviceUDID+'/first/initClient',
      headers: {
        'Authorization':'Basic ' + encodedAuth,
        'Connection': 'keep-alive',
        'Content-Type': 'application/json; charset=utf-8',
      },
      method:'POST',
      body:JSON.stringify(requestData),
      
    };

    function generate_following_db(following,locations){
        
        var following_db = {};
        for (var i = 0; i < following.length; i++) {
            following_db[following[i]['id']] = {
                'id':following[i]['id'],
                'name':following[i]['invitationAcceptedHandles'][0]
            }
        }

        for (var i = 0; i < locations.length; i++) {
            user_id = locations[i]['id'];
            location_data = locations[i]['location'];
            
            if(location_data === null){
                following_db[user_id]['status'] = "Unavailable";
                following_db[user_id]['timeStamp'] = 0;
                following_db[user_id]['longitude'] = 0.0;
                following_db[user_id]['latitude'] = 0.0;
                following_db[user_id]['address'] = "Unknown";

            }else{
                following_db[user_id]['status'] = "Active";
                following_db[user_id]['timeStamp'] = Math.floor(Date.now() / 1000) - Math.round(location_data['timestamp'] / 1000.0);
                following_db[user_id]['longitude'] = location_data['longitude'];
                following_db[user_id]['latitude'] = location_data['latitude'];
                
                
                var laddr = location_data['address'];
                var location_arr = [laddr['streetAddress'],laddr['locality'],laddr['stateCode']];
                following_db[user_id]['address'] = location_arr.join(", ");
            }
                
            
        }
        res.send(JSON.stringify(following_db));
        return following_db
    }

    function callback(error, response, body) {
      
      if (error || response.statusCode != 200) {
        
      }else{
        var info = JSON.parse(body);
        var following = info['following'];
        var locations = info['locations'];
        var following_db = generate_following_db(following,locations);


      }
    }

        



    request.post(options,callback);  
    
    
};
