/** 
 * registra todos los eventos sobre el elemento 'Menu' que es quien muestra
 *  el menu
 */
function registerMenu() {
    var menu = $('menu');
    menu.onclick = function() {
        $('optionpanel').style.display = 'block';
    }
}

/** 
 * registra toda la funcionalidad del boton 'More Places' en las paginas
 * de listado de spots (todas salvo la de cercania)
 */
function registerMoreElement() {
    var moreElement = $('more')
    var recents = $('recents')
    moreElement.page = 2;
    moreElement.addEvent('click', function() {
        var req = new Request({  
                 method: 'get',  
                 url:  moreElement.page  + '/',
                 onComplete: function(response) {
                    if(response.length == 0) {
                        moreElement.style.display = 'none';
                        moreElement.onclick = function (e)  {
                               // void
                        };

                    } else {
                        moreElement.page = moreElement.page +1
                        var div = document.createElement('div');
                        div.innerHTML = response;

                        for(var i = 0; i < div.childNodes.length; i++) {
                            recents.appendChild(div.childNodes[i]);
                        }
                    }
                 }  
             }).send();  
    });
}

//////////////////////////////////////////////////////////////////////////
// Proximity search
//////////////////////////////////////////////////////////////////////////
function ProximitySearch() {
}

ProximitySearch.prototype.updateLabel = function(lat, lon) {
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
           var selected = labels.selectedIndex == 0 ? '' : 
                   labels.options[labels.selectedIndex].value;

           labels.innerHTML = '';
           var entries = xml.getElementsByTagName('entry');

           labels.appendChild(new Element('option', { 
                 'html': 'Filter by label...'}));
           for(var i = 0; i < entries.length; i++) {
               var show = entries[i].getElementsByTagName('showText')[0].childNodes[0].data;

              var e = new Element('option', { 'html': show, });
              e.value = entries[i].getElementsByTagName('inputText')[0].childNodes[0].data;
              if(e.value == selected)  {
                 e.selected = 'true';
              }
              labels.appendChild(e);
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
   });
   req.send();
}

ProximitySearch.prototype.drawAddresses = function(places) {
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
        this.onPositionSelected(places[0].lat,  places[0].lon)
    } else {
        multipleFound.style.display = 'block';
        multipleFound.appendChild(new Element('span', { 
                'html': 'Hummm. Multiple posibilities..'}));
        foo = this.onPositionSelected;
        for(var i = 0; i < places.length; i++) {
           var div = new Element('div', { 
                'html': places[i].name,
                'events': {
                    'click': function(e) {
                         multipleFound.style.display = 'none';
                         foo(this.lat, this.lon);
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

ProximitySearch.prototype.updatePlaces = function(lat, lon, page, label) {
   var d = $('distance');

   var req = new Request({
       method: 'get',
       url: '../near/' + lat +  '/' + lon + '/' 
                       + d[d.selectedIndex].value + '/' + page + '/'
                       + (label == ''  ? '' :  (label + '/')),
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

/** 
 *  called on address search. parse the address results. returns an array of
 *  {name, lat, lon}
 */
ProximitySearch.prototype.parseAddressesFromXML = function(doc) {
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

ProximitySearch.prototype.onPositionSelected = function(lat, lon) {
   var moreElement = $('more');
   moreElement.lat = lat;
   moreElement.lon = lon;
   this.updateLabel(lat, lon);
   moreElement.label = '';
   this.updatePlaces(lat, lon, 1, moreElement.label);
}

function registerProximity() {
   var proximity = new ProximitySearch();
   var address = $('address');
   var defaultAddress = 'Callao y Santa Fe'
   address.onclick = function(e) {
       if(this.value == defaultAddress) {
           this.value = "";
       }
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
              $('distanceLi').style.display = 'none';
              $('labelsLi').style.display = 'none';
              $('results').style.display = 'none';
              $('more').style.display = 'block';
              proximity.drawAddresses(proximity.parseAddressesFromXML(xml));
           }
       }).send();
   };
   address.value = defaultAddress;


   $('distance').onchange= function(e) {
        moreElement.page = 1;
        proximity.updateLabel(moreElement.lat, moreElement.lon);
        proximity.updatePlaces(moreElement.lat, moreElement.lon, moreElement.page,
                     moreElement.label);
   };

   var moreElement = $('more');
   moreElement.page = 1;
   moreElement.label = '';
   moreElement.lat = 0;
   moreElement.lon = 0;
   moreElement.addEvent('click', function() {
       proximity.updatePlaces(this.lat, this.lon, this.page, moreElement.label);
       this.page = this.page + 1;
   });

   $('labels').onchange= function(e) {
       moreElement.label = this.selectedIndex == 0 ? '' : 
                           this.options[this.selectedIndex].value;
       moreElement.page = 1;
       proximity.updatePlaces(moreElement.lat, moreElement.lon,
                            moreElement.page, moreElement.label);
   }
}


