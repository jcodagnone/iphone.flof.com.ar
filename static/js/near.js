window.addEvent('domready', function() {
   var address = $('address');
   var defaultAddress = 'Callao y Santa Fe'
   address.onclick = function(e) {
       // e.stop();
       clickclear(this, defaultAddress);
   };

   address.onblur = function(e) {
       var req = new Request({
           method: 'get',
           url: '../feeds/xml/address/',
           data: { 
                'text' : address.value,
                'showCities' : 'false',
           },
           onComplete: function(txt, xml) {
              updateAddress(xml);
           }
       }).send();
   };
   address.value = defaultAddress;
});

var gLat = 0.0;
var gLon = 0.0;

function updateLabel() {
   var d = $('distance');
   var labels = $('labels');

   var req = new Request({
       method: 'get',
       url: '../feeds/xml/distance/',
       data: { 
            'lat' : gLat,
            'lon' : gLon,
            'd' : d[d.selectedIndex].value,
       },
       onComplete: function(txt, xml) {
          var entries = xml.getElementsByTagName('entry');

          labels.appendChild(new Element('option', { 
                'html': 'Filter by label...'}));
          for(var i = 0; i < entries.length; i++) {
              var show = entries[i].getElementsByTagName('showText')[0].childNodes[0].data;
              var label = entries[i].getElementsByTagName('inputText')[0].childNodes[0].data;

             labels.appendChild(new Element('option', {
                  'html': show,
                  'events': {
                  'click': function(e) {
                   },
                },
              }));
          }
       }
   }).send();

}

/** called on address search. parse the address results */
function updateAddress(doc) {
    var results =  doc.getElementsByTagName("results");
    var places = []
    for(var i = 0; i < results[0].childNodes.length; i++) {
        if(results[0].childNodes[i].nodeType == 1) {
            var e = results[0].childNodes[i];
            var n;
            if(e.nodeName == 'address') {
                n = e.getElementsByTagName('street')[0].childNodes[0].data
                      + ' '
                      + e.getElementsByTagName('altura')[0].childNodes[0].data;
            } else if(e.nodeName == 'street') {
                n = e.getElementsByTagName('name')[0].childNodes[0].data;
            }

            places.push({
                'name':  n,
                'lat': e.getElementsByTagName('point')[0].getAttribute('y'),
                'lon': e.getElementsByTagName('point')[0].getAttribute('x'),
            });
        }
    }


    var addresses = $('addresses');
    var noAddressFound = $('noaddress');
    var multipleFound = $('multipleaddr');
    
    addresses.style.display = 'none';
    noAddressFound.style.display = 'none';
    multipleFound.style.display = 'none';
    multipleFound.innerHTML = '';
    if(places.length == 0) {
        noAddressFound.style.display = 'block';
    } else if(places.length == 1) {
        gLon = places[0].lon;
        gLat = places[0].lat;
        updateLabel();
    } else {
        multipleFound.style.display = 'block';
        multipleFound.appendChild(new Element('span', { 
                'html': 'Hummm. Multiple posibilities..'}));
 
        for(var i = 0; i < places.length; i++) {
           var div = new Element('div', { 
                'html': places[i].name,
                'events': {
                    'click': function(e) {
                         gLon = this.lon;
                         gLat = this.lat;
                         multipleFound.style.display = 'none';
                         updateLabel();
                     },
                },
           });
          
           div.lat = places[i].lat
           div.lon = places[i].lon
           multipleFound.appendChild(div);
        }
    }

    addresses.style.display = 'block';
}

function clickclear(thisfield, defaulttext) {
    if (thisfield.value == defaulttext) {
        thisfield.value = "";
    }
}
function clickrecall(thisfield, defaulttext) {
     if (thisfield.value == "") {
        thisfield.value = defaulttext;
     }
}
        

