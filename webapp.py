#!/usr/bin/env python
#
# iphone.flof.com.ar provides a nice UI to access flof data from an iphone
#
# Copyright (c) 2008 by Zauber S.A. <www.zauber.com.ar>
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#

from sys import path
path.append('site-packages')
import web, os, urllib2, urllib, math
from web import template
from BeautifulSoup import BeautifulStoneSoup
from datetime import datetime


urls = (
    '/',                                    'RootController',
    '/place/(\d+)',                         'RedirectArgumentController',
    '/place/(\d+)/',                        'PlaceController',
    '/recent/',                             'RecentController',
    '/recent/(\d+)',                        'RedirectArgumentController',
    '/recent/(\d+)/',                       'RecentController',
    '/label/([^+\\"><|/]+)/',               'LabelController',
    '/label/([^+\\"><|/]+)/(\d+)/',         'LabelController',
    '/user/([^+\\"><|/]+)/',                'UserController',
    '/user/([^+\\"><|/]+)/(\d+)/',          'UserController',
    '/search/',                             'SearchController',
    '/about/',                              'AboutController',
    '/tips/',                               'TipsController',
    '/near/',                               'NearController',
    '/near/([^/]+)/([^/]+)/(\d+)/(\d+)/','NearPlacesController',
    '/near/([^/]+)/([^/]+)/(\d+)/(\d+)/([^/]+)/','NearPlacesController',
    '/feeds/xml/address/',                  'AddressController',
    '/feeds/xml/distance/',                 'DistanceController',
    '/feeds/xml/lookup/',                   'SpotLookupController',
    '/image/html/(\d+)/',                   'MapImageContainerController',
    '/image/data/(\d+)/',                   'MapImageDataController',
    '/image/thumbnail/(\d+)/',              'MapImageThumbnailController',
)


import md5, base64

class AbstractController:
    """ controlador base."""
    def GET(self, *args):
        clientEtag = web.ctx.env.get('HTTP_IF_NONE_MATCH')
        out = self.doGET(*args)
        etag = 'W/"%s"' % md5.new(out).hexdigest() 
        web.header('ETag', etag)
        if clientEtag and clientEtag == etag:
            web.ctx.status = '304 Not Modified'
        else:
            print out
            
class RootController(AbstractController):
    def doGET(self):
        return render.header('..') + render.root() + render.footer('..')

class AboutController(AbstractController):
    def doGET(self):
        return render.header('..') + render.about() + render.footer('..')

class TipsController(AbstractController):
    def doGET(self):
        return render.header('..') + render.tips() + render.footer('..')

class NearController(AbstractController):
    def doGET(self):
        lat, lon  = None, None
        if 'lat' in web.input():
            lat = web.input().lat
        if 'lon' in web.input():
            lon = web.input().lon
        return render.header('..') + render.near(lat, lon) +  render.footer()

class MapImageContainerController(AbstractController):
    def doGET(self, id):
        return render.imageContainer(id)

class MapImageDataController(AbstractController):
    def doGET(self, id):
        web.header('Content-Type', 'image/png')
        return mapService.render(id, 320, 416, 1000.0)[1]

class MapImageThumbnailController(AbstractController):
    def doGET(self, id):
        web.header('Content-Type', 'image/png')
        return mapServiceMini.render(id, 82, 82, 200.0)[1]

class RedirectPlaceController:
    def GET(self, id):
        web.seeother(id + '/')

class PlaceController(AbstractController):
    def doGET(self, id):
        spot = flof.geoinfo(id)
        referer = web.ctx.env.get('HTTP_REFERER')
        if referer == None:
            referer = '../../'
        else:
            v = referer.split('/')
            if len(v) >= 3 and v[3] == 'near':
                referer = '../../near/?lat=%s&lon=%s' % (spot['lat'],
                                                         spot['lon'])
        return render.header(referer) + render.place(spot) + render.footer()


class NearPlacesController(AbstractController):
    def doGET(self, lat, lon, distance, page, label = None):
        spots = flof.near(lat, lon, distance, page, label);
        return render.nearpage(spots, page)

class RecentController(AbstractController):
    def doGET(self, page=1):
        prefix = '..'
        page = int(page)
        spots = flof.recent(page)
        if page == 1:
            return render.header(prefix)  + \
                   render.spots(spots, prefix, 'Recent Places') + \
                   render.footer()
        elif len(spots):
            return render.recentpage(spots, page)

class UserController(AbstractController):
    def GET(self, user, page=1):
        prefix = '../..'
        page = int(page)

        spots =  flof.user(user, page)
        if page == 1:
            return render.header('..') + \
                   render.spots(spots, prefix, 'Places by `%s\'' % user) + \
                   render.footer()
        elif len(spots):
            return render.recentpage(spots, page, user)

class SearchController(AbstractController):
    def doGET(self, page=1):
        prefix = '..'
        page = int(page)
        if 't' in web.input():
            text = web.input().t
        else:
            text = None
        if text == None or text == '':
            return render.header('..') + render.search() + render.footer()
        else:
            spots =  flof.search(text, page)
            if page == 1:
                return render.header('..') + \
                       render.spots(spots, prefix,  
                          'Places that match `%s\'' % text) + \
                        render.footer()
            elif len(spots):
                return render.recentpage(spots, page, text)

class LabelController(AbstractController):
    def doGET(self, label, page=1):
        prefix = '../..'
        page = int(page)
        spots =  flof.label(label, page)
        referer = web.ctx.env.get('HTTP_REFERER')

        if page == 1:
            return render.header(referer) + \
                   render.spots(spots, prefix, 
                               'Places labeled with `%s\'' % label) + \
                   render.footer()
        elif len(spots):
             return render.recentpage(spots, page, label)

class AbstractProxyController(AbstractController):
    def doGET(self):
        try:
           y = urllib.urlopen('%s?%s' % (self.url,
              web.ctx.env['QUERY_STRING']))
           headers = str(y.info()).split('\n')
           for h in headers:
               if h.startswith("Content-Type:"):
                   a = h.split(':')
                   web.header(a[0], a[1].strip())
           ret = y.read()
           y.close()
           return ret
        except Exception, E:
            print web.internalerror()
            print "Some unexpected error occurred. Error text was:", E

class AddressController(AbstractProxyController):
    url = 'http://test.flof.com.ar/feeds/xml/address/'

class DistanceController(AbstractProxyController):
    url = 'http://test.flof.com.ar/feeds/xml/distance/'

class SpotLookupController(AbstractProxyController):
    url = 'http://test.flof.com.ar/bin/spot/lookup/'

from globalmaptiles import GlobalMercator 
gm = GlobalMercator()

class FlofTile(object):
    __slots__ = ( "layer", "id" , "x", "y", "z", "data", "width", 'height')

    def __init__ (self, layer, id):
         self.layer = layer
         self.id = id
         spot = flof.geoinfo(self.id)
         self.x, self.y = gm.LatLonToMeters(float(spot['lat']), float(spot['lon']))
         self.z = 1000.0
         self.data = 0
         self.data = None
         self.width = 320
         self.height = 416

    def size(self):
        return [self.width, self.height]

    def bounds(self):
       return ( self.x - self.z, self.y - self.z , self.x + self.z, self.y + self.z)

    def bbox (self):
        return ",".join(map(str, self.bounds()))


class MapService:
    """ render tiles """
    def __init__(self, layer, osmFile, watermark, cacheDir):
        import TileCache.Service
        from TileCache.Caches.Disk import Disk
        from TileCache.Layers.Mapnik import Mapnik

        self.layer = Mapnik(layer,
                 mapfile=osmFile,
                 watermarkimage=watermark,
                 watermarkopacity=1.0)
        self.tileService = TileCache.Service(Disk(cacheDir),
                                             {"layer": self.layer})
    def render(self, id, tileWidth, tileHeight, delta):
        tile =  FlofTile(self.layer, int(id))
        tile.width = tileWidth
        tile.height = tileHeight
        tile.z = delta
        format, image = self.tileService.renderTile(tile)
        return (format, self.layer.watermark(image))



class FlofFacade:
    headers = {}
    URL_BASE   = 'http://test.flof.com.ar'
    URL_SPOT   = '%s/feeds/xml/geoinfo/%s/'
    URL_RECENT = '%s/feeds/xml/recent/?page=%s'
    URL_LABEL  = '%s/feeds/xml/label/%s/?page=%s'
    URL_USER   = '%s/feeds/xml/user/%s/?page=%s'
    URL_SEARCH = '%s/feeds/xml/text/?q=%s&page=%s'
    URL_THUMB  = '%s/bin/spot/image/?action=thumb&imageid=%s'
    URL_LOOKUP = '%s/bin/spot/lookup/?lat=%s&lon=%s&d=%s&page=%s'

    def label(self, label, page=1):
        return self._parseSpots(self._retrieve(
                self.URL_LABEL % (self.URL_BASE, label, page)), page)

    def user(self, user, page=1):
        return self._parseSpots(self._retrieve(
                self.URL_USER% (self.URL_BASE, user, page)), page)

    def recent(self, page=1):
        return self._parseSpots(self._retrieve(
                self.URL_RECENT % (self.URL_BASE, page)), page)

    def search(self, text, page=1):
        return self._parseSpots(self._retrieve(
                self.URL_SEARCH % (self.URL_BASE, text, page)), page)

    def near(self, lat, lon, distance, page, label=None):
        url = self.URL_LOOKUP % (self.URL_BASE, lat, lon, distance, page)
        if label != None:
            url =  url + '&match=all&label0=' + label
        return self._parseSpotsGeoinfo(self._retrieve(url), 
                                   float(lat), float(lon), page)

    def geoinfo(self, id):
        soup = self._retrieve(self.URL_SPOT % (self.URL_BASE, id))
        ret = { 'urls': [],
                'geocoding': [],
                'photos': [],
                'reviews': [],
                'name':  soup.geoinfo['name'],
                'lat':  soup.geoinfo['lat'],
                'lon':  soup.geoinfo['lon'],
                'id':  id,
              }
        for i in soup.findChildren('spot'):
            if i['geocoding']:
                ret['geocoding'].append(i['geocoding'])
            if i['url']:
                ret['urls'].append(i['url'])
            if i['photo_url']:
                ret['photos'].append({
                       'url':   i['photo_url'],
                       'thumb': self.URL_THUMB % (self.URL_BASE, i['id']),
                   })


            if i['description']:
                d = BeautifulStoneSoup(i['description'], convertEntities=BeautifulStoneSoup.HTML_ENTITIES).contents[0].encode('utf-8') 
                e = i.date.contents[0][0:19]
                ret['reviews'].append({
                    'owner': i['owner'],
                    'text':  d,
                    'date':  datetime.strptime(e, "%Y-%m-%d %H:%M:%S")
                })
        ret['urls'].sort()
        ret['geocoding'].sort()
        ret['photos'].sort()
        ret['reviews'].sort(lambda x, y: cmp(y['date'], x['date']))

        ret['urls'] = uniquer(ret['urls'])
        ret['geocoding'] = uniquer(ret['geocoding'])
        ret['photos'] = uniquer(ret['photos'], lambda x: x['url'])
        labels = {}
        for i in soup.findChildren('label'):
            label = i['name']
            if label in labels:
                labels[label] = labels[label] + 1
            else:
                labels[label] = 1
        ret['labels'] = labels
        return ret 

    def _retrieve(self, url):
        """ retrives a remote xml  """
        y = urllib2.urlopen(url)
        xml = y.read()
        y.close()
        return BeautifulStoneSoup(xml, convertEntities=BeautifulStoneSoup.HTML_ENTITIES)

    def _parseSpotsGeoinfo(self, soup, lat, lon, page):
        ret = []
        for spots in soup.findChildren('spots'):
            labels = {}
            for i in spots.findChildren('label'):
                if labels.has_key(i['name']):
                   labels[i['name']] =  labels[i['name']] + 1
                else:
                   labels[i['name']] =  1
            l = [{'name': i, 'freq': labels[i]} for i in labels]
            l.sort(lambda x, y: cmp(y['freq'], x['freq']))
            spot = {
                 'id':       spots.findChildren('label')[0].parent.parent['id'],
                 'name':     spots.parent['name'],
                 'labels':   [i['name'] for i in l],
                 'distance': int(math.ceil(float(spots.findChildren('label')[0].parent.parent['distance']))),

            }
            #point = spots.parent.parent.parent
            #phi = math.degrees(math.atan2(
            #                    float(point['x']) - lat,
            #                    float(point['y']) -lon
            #                  ))
            #if (phi >= 0 and phi <= 45) or (phi <= 0 and phi >= -45):
            #    d = 'E'
            #elif phi >= 45 and phi <= 135:
            #    d = 'N'
            #elif phi <= -45 and phi >= -135:
            #    d = 'S'
            #else:
            #    d = 'W'
            #spot['orientation'] = d
            ret.append(spot)
        return ret 

    def _parseSpots(self, soup, page):
        spots = []
        for i in soup.findChildren('spot'):
            spot = {
                'id':     i['id'],
                'name':   i.geoinfo['name'],
                'labels': [ j['name'] for j in i.findChildren('label') ]
            }
            spot['labels'].sort()
            spots.append(spot)
        return spots 

def uniquer(seq, idfun=None):
    if idfun is None:
        def idfun(x): return x
    seen = {}
    result = []
    for item in seq:
        marker = idfun(item)
        # in old Python versions:
        # if seen.has_key(marker)
        # but in new ones:
        if marker in seen: continue
        seen[marker] = 1
        result.append(item)
    return result


    
#########################################################################

render = web.template.render('templates/', cache='DEV' not in os.environ)
template.Template.globals['len'] = len
template.Template.globals['version'] = '6'
flof = FlofFacade()

mapService = MapService('osm-iphone-big', '../osm/mapnik/osm-shirley.xml', \
           'static/images/watermark.png', '/tmp/tilecache')

mapServiceMini = MapService('osm-iphone-thumb',  \
           '../osm/mapnik/osm-shirley.xml', \
           'static/images/watermarkmini.png', '/tmp/tilecache')

if __name__ == "__main__":
    if 'DEV' in os.environ:
        middleware = [web.reloader]
    else:
        middleware = []
    web.run(urls, globals(), *middleware)
