#!/usr/bin/python

import csv
from datetime import datetime
from pprint import pprint

jul_5 = datetime.strptime('07-05-2013', '%m-%d-%Y')
jan_2000 = datetime.strptime('01-01-2000', '%m-%d-%Y')

result = []

#TODO: might want to read them all separately, but for now I'm just going to cycle the 5
with open('../data/heartrate_all.csv', 'rb') as csvfile:
    csvFile = csv.reader(csvfile)
    arr = []
    count = 0
    hr = 0.0
    orig_minute = 0
    for row in csvFile:
        minute = (int(float(row[0])) % (24*60*60))/60
        if minute != orig_minute:
            if count > 0:
                arr.append(hr/count)
            orig_minute = minute
            hr = 0.0
            count = 0
        hr = hr + float(row[1])
        count = count + 1
    while len(result) < 24*60:
        result.extend(arr)
    with open('../data/heartrate_full.csv', 'wb') as csvfile2:
        csvWriter = csv.writer(csvfile2)
        csvWriter.writerow(['date', 'heartrate'])
        for line in zip(['%02d:%02d' % (i/60, i%60) for i in range(1440)], result[:1440]):
            csvWriter.writerow(line)
