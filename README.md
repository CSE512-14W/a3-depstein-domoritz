# Assignment 3

## Team Members

1. Daniel Epstein depstein@cs
2. Dominik Moritz domoritz@cs

## Explore your day

This is an example repository for assignment 3 submission.
(Put your a brief description of your final interactive visualization application and your dataset here.)


## Running Instructions

Access our visualization at [cse512-14w.github.io/a3-depstein-domoritz/](http://cse512-14w.github.io/a3-depstein-domoritz/) or download this repository and run `python -m SimpleHTTPServer 9000` and access this from http://localhost:9000/.


## Story Board

The data contained 24 hours (at 1-minute intervals) of:

* Steps walked
* Flights of stairs climbed
* Heart rate
* Current named location (e.g. "Home", "CSE") or transport type (e.g. "Walking", "Running", "Transport")
  
The basic overview of the interface is here:

![summary](https://raw.github.com/CSE512-14W/a3-depstein-domoritz/gh-pages/pictures/summary.jpg)

We have two main views, a chart and a map. The chart displays the step, flight, and heart rate data, while the locations appear on the map. The x-axis of the chart is time, while the times of each event appear in tooltips on the map. We used a *focus+context* view for the chart, with the context view beneath the chart colored according to the places visited. To the right of the chart are a legend and some summary information about the current region selected.

We really wanted the interaction techniques to promote exploration of patterns in this data. As such, we intended for the visualization to be responsive to what the user was interested in learning more about by making nearly everything hoverable or selectable.

![summary](https://raw.github.com/CSE512-14W/a3-depstein-domoritz/gh-pages/pictures/home_hovered.jpg)

By hovering on one of the bars at the top of the chart (representing a current location or transport type), the corresponding tooltip appears on the map.

![summary](https://raw.github.com/CSE512-14W/a3-depstein-domoritz/gh-pages/pictures/hover_bar.jpg)

Hovering on a specific bar changes the summary to show statistics of the current bar.

![summary](https://raw.github.com/CSE512-14W/a3-depstein-domoritz/gh-pages/pictures/select_day.jpg)

The user can select a specific day to look at. We do not anticipate implementing this functionality, as doing so would require more data than we currently have available (but we anticipate the implementation of this feature would be fairly trivial).

![summary](https://raw.github.com/CSE512-14W/a3-depstein-domoritz/gh-pages/pictures/select_home.jpg)

The user can also click on features on the map itself, like selecting home.

![summary](https://raw.github.com/CSE512-14W/a3-depstein-domoritz/gh-pages/pictures/home_selected.jpg)

Doing so will update the chart, alpha-ing down the unselected regions.

![summary](https://raw.github.com/CSE512-14W/a3-depstein-domoritz/gh-pages/pictures/select_span.jpg)

As described before, we implemented focus+context. This means that the user can select a span

![summary](https://raw.github.com/CSE512-14W/a3-depstein-domoritz/gh-pages/pictures/span_selected.jpg)

And that span will then be focused on in the above chart, as well as highlighted in the map.

### Changes between Storyboard and the Final Implementation

Instead of hovering over the bars in the chart and having the information update the summary pane, we implemented a hover line that shows the detailed information.

Instead of implementing focus+context from the map by alpha-ing out unselected regions, we require the user to select a specific time span from the tooltip.

Hovering on a region in the chart is not reflected in the map. Instead, users have to click on on a region to change the span that is focused on. Furthermore, there is no differentiation between highlighted time spans and a time span that is focused on any more because they have been unified into one. 


## Development Process

* Daniel initially focused on the graph, Dominik focused on the map
* Daniel created a function to set the brush programatically, Dominik implemented the interaction between the map and the chart
* We spent about
  * 2 hours on the initial design of the story board
  * several hours on a failed attempt to use a D3 layer with leaflet (eventually we switched to pure Leaflet)
  * 7 hours on the map and the interaction between the map and the chart
  * 1 hour on the summary pane and legend
  * 7 hours on chart
  * 6 hours on the map
  * 8 hours on the interaction between the map and the chart and refinements
* Adding interaction between the map and the chart and within the chart and the map took the most time.
