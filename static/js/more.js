window.addEvent('domready', function() {
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
});
