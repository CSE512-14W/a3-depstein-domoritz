#!/usr/bin/python

import csv
from datetime import datetime
from pprint import pprint
import random

means = [60]*(6*60) + [70]*(1*60) + [140]*(1*23) + [100]*(1*22) + [70]*(15+4*60) + [80]*(1*30) + [70]*(4*60) + [80]*(30) + [70]*(1*60) + [80]*(2*60) + [70]*(2*60) + [60]*(2*60)

result = [60.52, 59.24]

for i in range(len(result), 1440):
    result.append((random.gauss(means[i], 10) + result[-1] + result[-2])/3)
    #print random.gauss(0, 10)


with open('../data/heartrate_full.csv', 'wb') as csvfile2:
    csvWriter = csv.writer(csvfile2)
    csvWriter.writerow(['date', 'heartrate'])
    for line in zip(['%02d:%02d' % (i/60, i%60) for i in range(1440)], result[:1440]):
        csvWriter.writerow(line)