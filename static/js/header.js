//////////////////////////////////////////////////////////////////////////
// 
//////////////////////////////////////////////////////////////////////////
function registerSearch() {
    var labelForm = $('labelForm');
    labelForm.onsubmit = function() {
          var label = document.forms.labelForm.elements[0].value;
          document.forms.labelForm.action='/label/' + label + '/';
          document.forms.labelForm.elements[0].value = '';
          return label != ''
    }

    var userForm = $('userForm');
    userForm.onsubmit = function() {
          var label = document.forms.userForm.elements[0].value;
          document.forms.userForm.action='/user/' + label + '/';
          document.forms.userForm.elements[0].value = '';

          return label != ''
    }

    var textForm = $('js-search');
    textForm.onsubmit = function() {
          var label = document.forms.textForm.elements[0].value;
          return label != ''
    }

}

//////////////////////////////////////////////////////////////////////////
// Menu & More
//////////////////////////////////////////////////////////////////////////

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
       proximity.startProgressBar();
        var req = new Request({  
                 method: 'get',  
                 url:  moreElement.page  + '/',
                 onFailure: proximity.stopProgressBar,
                 onComplete: function(response) {
                    proximity.stopProgressBar();
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
   this.page = 1;
   this.label = '';
   this.lat = 0;
   this.lon = 0;
   this.nProgress =  0;
}

/**
 * called when the distance or the coordinates changes, so the filter by label
 * is updated
 */
ProximitySearch.prototype.updateLabel = function() {
   var d = $('distance');
   var labels = $('labels');

   var este = this;
   this.startProgressBar();
   var req = new Request({
       method: 'get',
       url: '../feeds/xml/distance/',
       data: { 
            'lat' : this.lat,
            'lon' : this.lon,
            'd' : d[d.selectedIndex].value,
       },
       onFailure: este.stopProgressBar,
       onComplete: function(txt, xml) {
           este.stopProgressBar();
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

/**
 * On address retrieval, this draws the address for selection
 */
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
        foo = this;
        for(var i = 0; i < places.length; i++) {
           var div = new Element('div', { 
                'html': places[i].name,
                'events': {
                    'click': function(e) {
                         multipleFound.style.display = 'none';
                         foo.onPositionSelected(this.lat, this.lon);
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

/** updates the list of places */
ProximitySearch.prototype.updatePlaces = function() {
   var d = $('distance');
 
   var proximity = this; 

   proximity.startProgressBar();
   var req = new Request({
       method: 'get',
       url: '../near/' + this.lat +  '/' + this.lon + '/' 
                       + d[d.selectedIndex].value + '/' + this.page + '/'
                       + (this.label == ''  ? '' :  (this.label + '/')),
       onFailure: proximity.stopProgressBar,
       onComplete: function(response) {
         proximity.stopProgressBar();
         var moreElement = $('more');
         if(response.length < 2) {
             moreElement.style.display = 'none';
         } else {
             var results = $('results');
             if(proximity.page == 1) {
                results.innerHTML = '';
             }
             var div = document.createElement('div');
             div.innerHTML = response;
             for(var i = 0; i < div.childNodes.length; i++) {
                 results.appendChild(div.childNodes[i]);
             }
             if(proximity.page == 1) {
                results.style.display = 'block'
                moreElement.style.display = 'block';
                proximity.page = 2;

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
   this.lat = lat;
   this.lon = lon;
   this.updateLabel();
   this.label = '';
   this.updatePlaces(lat, lon, 1, this.label);
}

ProximitySearch.prototype.startProgressBar = function() {
    this.nProgress++;
    $('menuLoad').style.display = 'block';
}


ProximitySearch.prototype.stopProgressBar = function() {
    this.nProgress--;
    if(this.nProgress <= 0) {
       this.nProgress = 0;
       $('menuLoad').style.display = 'none';
    }

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

   address.onblur = function(e) {
       proximity.startProgressBar();
       var req = new Request({
           method: 'get',
           url: '../feeds/xml/address/',
           data: { 
                'text' : address.value,
                'showCities' : 'false',
           },
           onFailure: proximity.stopProgressBar,
           onComplete: function(txt, xml) {
              proximity.stopProgressBar();
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
        proximity.page = 1;
        proximity.updateLabel();
        proximity.updatePlaces();
   };

   $('more').addEvent('click', function() {
       proximity.updatePlaces();
       proximity.page = proximity.page + 1;
   });

   $('labels').onchange= function(e) {
       proximity.label = this.selectedIndex == 0 ? '' : 
                           this.options[this.selectedIndex].value;
       proximity.page = 1;
       proximity.updatePlaces();
   }
}

///////////////////////////////////////////////////////////////////////////
// choose the js to load depending on the webpage
//////////////////////////////////////////////////////////////////////////
window.addEvent('domready', function() {
    if($('js-more')) {
        registerMoreElement();
    } else if($('js-near')) {
        registerProximity();
    } else if($('js-search')) {
        registerSearch();
    }

    var panelElement = $('optionpanel');
    $('menu').onclick = function(e) {
        if(panelElement.style.display == 'block') {
                panelElement.style.display = 'none';
        } else {
                panelElement.style.display = 'block';
        }
    };

    $('menuHide').onclick = function(e) {
        panelElement.style.display = 'none';
    };
});

window.onload = function() {
      setTimeout(function(){window.scrollTo(0, 1);}, 100);
}
