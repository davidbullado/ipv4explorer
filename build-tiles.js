/*global http*/
var request = require('sync-request');
var sync = 0 ;

for (var i=7; i < 16; i++){
    var z = i+1;
    var max = Math.pow(2,z);
    
    for (var y=0; y < max ; y++){
        for (var x=0; x < max ; x++){
  
            console.log ('/tiles/'+z+"/"+x+"/"+y);
            
            var res = request('GET', 'http://127.0.0.1:8080'+'/tiles/'+z+"/"+x+"/"+y);
         
        }
    }
}