var moreElement = $('more')
var recents = $('recents')
moreElement.addEvent('click', function() {
    var req = new Request({  
             method: 'get',  
             url: '../recent/' + moreElement.page  + '/',
             data: { 'do' : '1' },  
             onComplete: function(response) {
                moreElement.page = moreElement.page +1
                var div = document.createElement('div');
                div.innerHTML = response;

                for(var i = 0; i < div.childNodes.length; i++) {
                    recents.appendChild(div.childNodes[i]);
                }
             }  
         }).send();  
});

