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
              resetView();
              drawAddresses(parseAddressesFromXML(xml));
           }
       }).send();
   };
   address.value = defaultAddress;

   $('distance').onchange= function(e) {
       drawPlaces(parsePlaces());
   };
});

function updateLabel(lat, lon) {
   var d = $('distance');
   var labels = $('labels');

   var req = new Request({
       method: 'get',
       url: '../feeds/xml/distance/',
       data: { 
            'lat' : lat,
            'lon' : lon,
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

          var a = $('labelsLi');
          var b = $('distanceLi');
          if(a.style.display = 'none') {
              a.style.display = 'block';
          }
          if(b.style.display = 'none') {
              b.style.display = 'block';
          }
       }
   }).send();
}


function resetView() {
    $('distanceLi').style.displey = 'none';
    $('labelsLi').style.displey = 'none';
    $('results').style.displey = 'none';
}

function drawPlaces(places) {
   var results = $('results');

   // clean old results
   if (results.childNodes.length > 0) {
        results.removeChild(results.lastChild);
   }

   // no places found
   if(places.length == 0) {
        results.appendChild((new Element('li', { 'html': 'No places found :^(' })));
   }

   // places found
   for(var i = 0; i < places.length ; i++) {
       results.appendChild(new Element('li', { 'html': places[i].name, 
                                                'class': 'arrow'}));
   }
}

function drawAddresses(places) {
    var addresses = $('addresses');
    var noAddressFound = $('noaddress');
    var multipleFound = $('multipleaddr');

    addresses.style.display = 'none';
    noAddressFound.style.display = 'none';
    multipleFound.style.display = 'none';
    multipleFound.innerHTML = ''

    if(places.length == 0) {
        noAddressFound.style.display = 'block';
    } else if(places.length == 1) {
        updateLabel(places[0].lat,  places[0].lon)
    } else {
        multipleFound.style.display = 'block';
        multipleFound.appendChild(new Element('span', { 
                'html': 'Hummm. Multiple posibilities..'}));
        
        for(var i = 0; i < places.length; i++) {
           var div = new Element('div', { 
                'html': places[i].name,
                'events': {
                    'click': function(e) {
                         multipleFound.style.display = 'none';
                         updateLabel(this.lat, this.lon);
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

//////////////////////////////////////////////////////////////////////////////////
//
/** 
 *  called on address search. parse the address results. returns an array of
 *  {name, lat, lon}
 */
function parseAddressesFromXML(doc) {
    var results =  doc.getElementsByTagName("results");
    var places = []
    for(var i = 0; i < results[0].childNodes.length; i++) {
        if(results[0].childNodes[i].nodeType == 1) {
            var e = results[0].childNodes[i];
            var n;
            if(e.nodeName == 'address') {
                if(e.getElementsByTagName('altura').length > 0) {
                     n = e.getElementsByTagName('street')[0].childNodes[0].data
                       + ' '
                       + e.getElementsByTagName('altura')[0].childNodes[0].data;
                } else {
                     n = e.getElementsByTagName('street1')[0].childNodes[0].data
                      + ' y '
                      + e.getElementsByTagName('street2')[0].childNodes[0].data;
                }
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
    return places;
}

function parsePlaces() {
    return [{
               'name':       'Test',
               'distance':   '12',
       }, ];
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
        

