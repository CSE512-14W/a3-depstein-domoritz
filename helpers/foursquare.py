#!/usr/bin/python
# -*- coding: utf-8 -*-

import requests
import json
from pprint import pprint
import cPickle as pickle

class FourSquare:
    def __init__(self):
        self.baseUrl = 'https://api.foursquare.com/v2/venues/'
        self.credentials = '?client_id=2R1NS4XB3YXPDI4KVVRBWYPVF1MWTCYFX53X3HQABSVRIJED&client_secret=NMZF2M40UBNRIMPW1HZWWB2AIJQQA2UZMHEIUH2NA5W155JB&v=20130724'
        self.lookup = {}
        self.categoryCache = {}

    def getVenue(self, venue):
        if venue in self.lookup:
            return self.lookup[venue]
        response = requests.get(self.baseUrl + venue + self.credentials)
        while response.status_code != requests.codes.ok:
            print 'Trying to get a response from FourSquare...'
            response = requests.get(self.baseUrl + venue + self.credentials)
        self.lookup[venue] = json.loads(response.content)['response'].get('venue',{})
        return self.lookup[venue]

    def getCategories(self):
        categories = {}
        try:
            categories = pickle.load(open('categories.p', 'rb'))
        except IOError:
            categories = json.loads(requests.get(self.baseUrl + 'categories' + self.credentials).content)['response']['categories']
            pickle.dump(categories, open('categories.p', 'wb'))
        return categories

    def getParent(self, target):
        categories = self.getCategories()
        for cat1 in categories:
            if cat1['id'] == target:
                return ''
            for cat2 in cat1['categories']:
                if cat2['id'] == target:
                    return cat1['name']
                for cat3 in cat2['categories']:
                    if cat3['id'] == target:
                        return cat1['name']
        return 'Not Found'

    def findCategory(self, target):
        if target in self.categoryCache:
            return self.categoryCache[target]
        self.categoryCache[target] = self.findCategoryRec(self.getCategories(), target)
        return self.categoryCache[target]

    def findCategoryRec(self, categories, target):
        if categories == []:
            return []
        for category in categories:
            if category['id'] == target:
                return [category]
            if 'categories' in category:
                retVal = self.findCategoryRec(category['categories'], target)
                if retVal != []:
                    return retVal + [category]
        return []