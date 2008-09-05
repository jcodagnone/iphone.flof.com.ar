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
import web, os, urllib2
from web import template
from BeautifulSoup import BeautifulStoneSoup
from datetime import datetime



urls = (
    '/',                                    'RootController',
    '/place/(\d+)',                         'PlaceController',
    '/place/(\d+)/',                         'PlaceController',
)


class RootController:
    def GET(self):
        print render.header()
        print render.root()
        print render.footer()

class PlaceController:
    def GET(self, id):
        print render.header()
        print render.place(flof.geoinfo(id), 'hola')
        print render.footer()

class Flof:
    headers = {}
    URL_THUMB = 'http://test.flof.com.ar/bin/spot/image/?action=thumb&imageid=%s'
    URL_SPOT = 'http://localhost:9091/feeds/xml/geoinfo/%s/'

    def geoinfo(self, id):
        opener = urllib2.build_opener()
        req = urllib2.Request(self.URL_SPOT % id,{}, self.headers)
        y = opener.open(req)
        xml = y.read()
        y.close()
        soup = BeautifulStoneSoup(xml,  convertEntities='xml', smartQuotesTo='xml')
        ret = { 'urls': [],
                'geocoding': [],
                'photos': [],
                'reviews': [],
                'name':  soup.geoinfo['name'],
                'lat':  soup.geoinfo['lat'],
                'lon':  soup.geoinfo['lon'],
              }
        for i in soup.findChildren('spot'):
            if i['geocoding']:
                ret['geocoding'].append(i['geocoding'])
            if i['url']:
                ret['urls'].append(i['url'])
            if i['photo_url']:
                #ret['photos'].append(i['photo_url'])
                ret['photos'].append({
                       'url':   i['photo_url'],
                       'thumb': self.URL_THUMB % i['id'],
                   })

            if i['description']:
                ret['reviews'].append({
                    'owner': i['owner'],
                    'text':  i['description'],
                    'date':  datetime.strptime(i.date.contents[0][:-9], 
                                              "%Y-%m-%d %H:%M:%S")
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
flof = Flof()
print flof.geoinfo('10009')
if __name__ == "__main__":

    if 'DEV' in os.environ:
        middleware = [web.reloader]
    else:
        middleware = []
    web.run(urls, globals(), *middleware)
