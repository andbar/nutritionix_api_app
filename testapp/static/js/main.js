// custom javascript

$(function() {
  createGraph1();
  createGraph2();
  createProductList();
});

function createGraph1() {
  var width = 600;
  var height = 400;
  var format = d3.format(",d");  // convert value to integer
  var color = d3.scale.category20();  // create ordinal scale with 20 colors
  var sizeOfRadius = d3.scale.pow().domain([-100,100]).range([-50,50]);  // https://github.com/mbostock/d3/wiki/Quantitative-Scales#pow

  var bubble = d3.layout.pack()
      .sort(function(a, b) {
	    return (a.value - b.value)
	  })
      .size([width, height])
      .padding(1)
      .radius(function(d) { return 10 + sizeOfRadius(d) * 2; })
      .value(function(d) { return d.size; });

  var svg = d3.select("#bubble-chart").append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "bubble");

  //REQUEST THE DATA
  d3.json("/api/ingredients/", function(error, ingredients_json) {
    if (error) throw error;
    var node = svg.selectAll('.node')
        .data(bubble.nodes(processData(ingredients_json))
        .filter(function(d) { return !d.children; }))
      .enter().append('g')
        .attr('class', 'node')
        .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'});

      node.append('circle')
        .attr('r', function(d) { return d.r; })
        .style('fill', function(d) { return color(d.className); })

        .on("mouseover", function(d) {
          tooltip.text(d.name + ": " + d.size + " products");
          tooltip.style("visibility", "visible");
        })
        .on("mousemove", function() {
          return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
        })
        .on("mouseout", function() {return tooltip.style("visibility", "hidden");})

        .on("click", function(d) { updateProductList(d.name) });

      node.append('text')
        .attr("dy", ".3em")
        .style('text-anchor', 'middle')
        .text(function(d) { return d.size; });
  });

  // tooltip config
  var tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("color", "white")
    .style("padding", "8px")
    .style("background-color", "rgba(0, 0, 0, 0.75)")
    .style("border-radius", "6px")
    .style("font", "12px sans-serif")
    .text("tooltip");

  function processData(data) {
    var newDataSet = [];

    for(var prop in data) {
      newDataSet.push({name: prop, className: prop.toLowerCase(), size: data[prop].length});
    }
    return {children: newDataSet};
  }
};


function createGraph2() {
  var margin = {top: 20, right: 20, bottom: 110, left: 50};
  var width = 600 - margin.left - margin.right;
  var height = 400 - margin.top - margin.bottom;

  var x = d3.scale.ordinal().rangeRoundBands([0, width], .5);
  var y = d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(10);

  var svg = d3.select("#bar-graph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.json("/api/ingredients/", function(error, ingredients_json) {
    var data = processBarData(ingredients_json)
    x.domain(data.map(function(d) { return d.name; }));
    y.domain([0, d3.max(data, function(d) { return d.size; })]);

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "+0em")
      .attr("dy", "+.75em")
      .attr("transform", "rotate(-30)");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("");

    svg.selectAll("bar")
        .data(data)
      .enter().append("rect")
        .style('fill', "#1f77b4")
        .attr("x", function(d) { return x(d.name); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.size); })
        .attr("height", function(d) { return height - y(d.size); });

  });

  function processBarData(data) {
    var newDataSet = [];

    for(var prop in data) {
      newDataSet.push({name: prop, size: data[prop].length});
    }
    newDataSet.sort(function(a, b) {
      return b.size - a.size;
    });
    return newDataSet.slice(0, 10);
  }

};


function createProductList() {
  d3.json("/api/ingredients/", function(error, ingredients_json) {
    if (error) throw error;
    var data = processListData(ingredients_json);
    var width = 1238;
    var height = 150;
    var margin = {top: 20, right: 20, bottom: 110, left: 50};

    var listTitle = d3.select("#list-title")
      .text(data.name + " is found in " + data.size + " products");

    var prodList = d3.select("#list-graph").append("ul")
      .attr("width", width)
      .attr("height", height)
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .selectAll("li")
      .data(data.products)
      .enter()
      .append("li")
      .append("a")
      .text(function(d){return d})
      .attr("href", function(d){return "/products/" + d} );

  });

  function processListData(data) {
    var newDataSet = [];

    for(var prop in data) {
      newDataSet.push({name: prop, size: data[prop].length, products: data[prop]});
    }
    newDataSet.sort(function(a, b) {
      return b.size - a.size;
    });
    return newDataSet[0];
  }
};


function updateProductList(ingredient) {
  d3.json("/api/ingredients/", function(error, ingredients_json) {
    if (error) throw error;
    var newData = ingredients_json;

    var listTitle = d3.select("#list-title").transition()
      .text(ingredient + " is found in " + newData[ingredient].length + " products");

    var prodList = d3.select("#list-graph");

    prodList.selectAll("ul").remove();

    prodList.append("ul")
      .selectAll("li")
      .data(newData[ingredient])
      .enter()
      .append("li")
      .append("a")
      .text(function(d){return d})
      .attr("href", function(d){return "/products/" + d} );

  });
}
