window.addEvent('domready', function() {
   var address = $('address');
   var defaultAddress = 'Callao y Santa Fe'
   address.onclick = function(e) {
       // e.stop();
       clickclear(this, defaultAddress);
   };

   // address.onchange = address.onblur = function(e) {
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

   var moreElement = $('more');
   $('distance').onchange= function(e) {
        updatePlaces(moreElement.lat, moreElement.lon, moreElement.page);
   };

    moreElement.page = 2;
    moreElement.addEvent('click', function() {
        updatePlaces(this.lat, this.lon, this.page);
        this.page = this.page + 1;
    });
});

function onPositionSelected(lat, lon) {
   var moreElement = $('more');
   moreElement.lat = lat;
   moreElement.lon = lon;
   updateLabel(lat, lon);
   updatePlaces(lat, lon, 1);
}

function updatePlaces(lat, lon, page) {
   var d = $('distance');

   var req = new Request({
       method: 'get',
       url: '../near/' + lat +  '/' + lon + '/' 
                       + d[d.selectedIndex].value + '/' + page + '/',
       onComplete: function(response) {
         var more = $('more');
         if(response.length < 2) {
             more.style.display = 'none';
         } else {
             var results = $('results');
             if(page == 1) {
                results.innerHTML = '';
             }
             var div = document.createElement('div');
             div.innerHTML = response;
             for(var i = 0; i < div.childNodes.length; i++) {
                 results.appendChild(div.childNodes[i]);
             }
             if(page == 1) {
                results.style.display = 'block'
                more.page = 2;
                more.style.display = 'block';
             }
         }
       }
   }).send();

}

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
    $('distanceLi').style.display = 'none';
    $('labelsLi').style.display = 'none';
    $('results').style.display = 'none';
    $('more').style.display = 'block';
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
        onPositionSelected(places[0].lat,  places[0].lon)
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
                         onPositionSelected(this.lat, this.lon);
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
        

