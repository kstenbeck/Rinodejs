var msg = 'Hello World';
console.log(msg);

var express = require('express');
var app = express();
app.use(
   express.urlencoded({
     extended: true
   })
 ) 
app.use(express.json())

var fs = require("fs");
var jwt = require('jsonwebtoken');
var https = require('https');
var axios = require('axios')



app.get('/insert', function (req, res) {
   var MongoClient = require('mongodb').MongoClient;
   var url = "mongodb://localhost:27017/";
   
   MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
     if (err) throw err;
     var dbo = db.db("mydb");
   
     var myobj = { name: req.query.Name };
     
     dbo.collection("customers").insertOne(myobj, function(err, res) {
       if (err) throw err;
       console.log("1 document inserted");
       db.close();      

     });

   });
   res.end("Inserted: " + req.query.Name );   
})

app.get('/update', function (req, res) {
   var MongoClient = require('mongodb').MongoClient;
   var url = "mongodb://localhost:27017/";
   
   MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
     if (err) throw err;
     var dbo = db.db("mydb");
   
     var myquery = { name: req.query.Name };
     var newvalues = { $set: {name: req.query.NewName } };
     
     dbo.collection("customers").updateOne(myquery, newvalues, function(err, res) {
       if (err) throw err;
       console.log("1 document updated");
       db.close();      

     });

   });
   res.end("Updated: " + req.query.NewName );   
})


app.get('/find', function (req, res) {
   var MongoClient = require('mongodb').MongoClient;
   var url = "mongodb://localhost:27017/";
   
   MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
     if (err) throw err;
     var dbo = db.db("mydb");
   
     var query = { name: req.query.Name };
     
     dbo.collection("customers").find(query).toArray(function(err, result) {
      if (err) throw err;
      console.log(result);
      db.close();  
      res.end(JSON.stringify(result));    

     });

   });
     
})


app.post('/serviceInvoke', function (req, res) {
   console.log(req.body);

   console.log(req.body.dataSet.rows[0][1]);

   console.log(req.body.onCompletionCallbackEndpoint.url);   

   var payload = {
  "iss": req.body.instanceContext.appId,
  "sub": req.body.instanceContext.installId,
  "aud": req.body.instanceContext.instanceId,
  "exp": Math.floor(Date.now() / 1000) + (60 * 60),
  "iat": Math.floor(Date.now() / 1000),
  "o.a.p.ctenantId": req.body.instanceContext.tenantId
   }

   var token = jwt.sign(payload, req.body.instanceContext.secret);
   console.log("Bearer " + token);

   var onCompletePayload = {      
         "fieldDefinitions": [{
          "name": "appcloud_row_correlation_id",
          "dataType": "Text",
          "width": 40,
          "unique": true,
          "required": true,
          "readOnly": null,
          "minimumValue": null,
          "maximumValue": null,
          "possibleValues": null,
          "format": null,
          "resources": null
         }, {
          "name": "appcloud_row_status",
          "dataType": "Text",
          "width": 10,
          "unique": null,
          "required": true,
          "readOnly": null,
          "minimumValue": null,
          "maximumValue": null,
          "possibleValues": ["success", "warning", "failure"],
          "format": null,
          "resources": null
         }, {
          "name": "appcloud_row_errormessage",
          "dataType": "Text",
          "width": 5120,
          "unique": null,
          "required": null,
          "readOnly": null,
          "minimumValue": null,
          "maximumValue": null,
          "possibleValues": null,
          "format": null,
          "resources": null
         }
         ],
         "dataSet": {
          "id": req.body.dataSet.id,
          "rows": [
           [req.body.dataSet.rows[0][0], "success", null]
          ],
          "size": null
         }
       }

       axios({
         method: 'post',
         url: req.body.onCompletionCallbackEndpoint.url,
         data: onCompletePayload,
         headers: {
            'content-type': 'application/json',
            authorization: "Bearer " + token
          }
       })      
       .then((res) => {
         console.log(res.data)
       })
       .catch((error) => {
         console.error(error)
       })
       

   res.end("Invoked OK");
})

app.post('/appInstall', function (req, res) {
   console.log(req.body);
   
   var MongoClient = require('mongodb').MongoClient;
   var url = "mongodb://localhost:27017/";
   
   MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
     if (err) throw err;
     var dbo = db.db("mydb");
   
     var myquery = { iss: req.body.iss  };
     var newvalues = { $set: {iss: req.body.iss, sub: req.body.sub,  csourceRequest: req.body["o.a.p.csourceRequest"] } };
     var options = { upsert: true };
     
     dbo.collection("appConfig").updateOne(myquery, newvalues, options, function(err, res) {
       if (err) throw err;
       console.log("1 document updated");
       db.close();    
         
     });
   });
   res.end("Upsert: " + req.body.iss );
})

app.post('/appConfig', function (req, res) {
   res.sendFile( __dirname + "/" + "AppConfig.html");
})


app.post('/serviceConfig', function (req, res) {
   fs.readFile( __dirname + "/" + "ServiceConfig.html", 'utf8', function (err, data) {
      console.log( data );
      res.end( data );
   });
})

app.get('/helloWorld', function (req, res) {
      res.end( "haj haj" );   
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})