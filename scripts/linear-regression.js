/* Applying the MVC model in Linear Regression chart */
function LinearRegressionModel() {
    //Set up the datapoint list (containing the x and y coordinates)
    this.datapoints = []

    //Set up the parameter in y = mx + b (m and b)
    this.m = 0;
    this.b = 0;
}

LinearRegressionModel.prototype.clearDatapoints = function() {
    //Clear all the datapoint from the model
    //Assigning datapoints to new empty array
    this.datapoints = [];
}

LinearRegressionModel.prototype.addDatapoint = function(datapoint) {
    //Add a datapoint to the model
    //Datapoint is an object of { x: x coordinates, y: y coordinates }
    this.datapoints.push(datapoint);
}

LinearRegressionModel.prototype.startFit = function() {
    //Start fitting the line
    //Call onFitIteration somewhere in the loop
}

LinearRegressionModel.prototype.bindFitIteration = function(onFitIteration) {
    //Bind the on fit iteration hook
    //onTrainIteration is a function of type function(m, b) where m, b are updated parameters for the line
    this.onFitIteration = onFitIteration;
}


/* The View */
function LinearRegressionView(element, clearButton, trainButton, configuration) {
    //Set the element to draw to
    this.root = element;

    //Set the two buttons to clear datapoint and start training
    this.clearButton = clearButton;
    this.trainButton = trainButton;

    //Configuration object: { width: ..., height: ..., margin: ... }
    this.configuration = configuration;
}

LinearRegressionView.prototype.render = function(datapoints, line) {
    //Render the canvas and axes
    this.renderCanvas();
    this.renderAxes();

    //Render the graph, all the points and the line mx + b
    this.renderLine(line);
}

LinearRegressionView.prototype.renderCanvas = function() {
    //Render the initial canvas layout

    //Define the height and wdith of canvas
    var margin = this.configuration.margin;
    var width = this.configuration.width;
    var height = this.configuration.height;

    //Create SVG element
    this.graph = d3.select(this.root)
        .append("svg")
            .attr("width", '100%')
            .attr("height", '100%')
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .style("background-color", "#FFF")
        .append("g")
            .attr("transform", `translate(${margin}, ${margin})`);
}

LinearRegressionView.prototype.renderAxes = function() {
    //Render the x and y axes

    //Define the margin
    var margin = this.configuration.margin;
    var width = this.configuration.width - margin * 2;
    var height = this.configuration.height - margin * 2;

    //Create x and y scale
    this.scaleX = d3.scaleLinear()
        .domain([0, 10])
        .range([0, width]);

    this.invertScaleX = d3.scaleLinear()
        .domain([0, width])
        .range([0, 10]);

    this.scaleY = d3.scaleLinear()
        .domain([0, 10])
        .range([height, 0])

    this.invertScaleY = d3.scaleLinear()
        .domain([height, 0])
        .range([0, 10])

    //Draw the axes
    this.graph
        .append("g")
            .attr("transform", `translate(0, ${width})`)
            .call(d3.axisBottom(this.scaleX));

    this.graph
        .append("g")
            .call(d3.axisLeft(this.scaleY));
}

LinearRegressionView.prototype.renderPoint = function(datapoint) {
    //Add a single datapoint to graph
    //datapoint is an object of shape { x: ..., y: ... }

    //Get x and y coordinate from graph
    var { x, y } = datapoint;

    //Draw datapoint
    this.graph.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 5)
        .style("fill", "#000");
}   

LinearRegressionView.prototype.clearPoints = function() {
    //Clear all points from the graph
    this.graph.selectAll("circle")
        .remove()
}

LinearRegressionView.prototype.renderLine = function(line) {
    //Render the line y = mx + b on the graph
    //line is an object of shape { m: ..., b: ... }

    //Get m and b from line
    var { m, b } = line;

    //Initialize two coordinate pair {x1, y1} and {x2, y2}
    var x1 = 0;
    var y1 = m * x1 + b;
    var x2 = 10;
    var y2 = m * x2 + b;

    //Draw convert to coordinates
    var graphX1 = this.scaleX(x1), graphY1 = this.scaleY(y1);
    var graphX2 = this.scaleX(x2), graphY2 = this.scaleY(y2);

    //Draw the coordinates
    this.graph.append("line")
        .style("stroke", "#DDA15E")
        .style("stroke-width", 2)
        .attr("x1", graphX1)
        .attr("y1", graphY1)
        .attr("x2", graphX2)
        .attr("y2", graphY2);
}

LinearRegressionView.prototype.bindClearDatapoints = function(onClearDatapoints) {
    var view = this;

    //Bind the on clear datapoint hook
    d3.select(this.clearButton).on("click", function(event) {
        view.clearPoints();
    });

    //Call clear point hook
    onClearDatapoints();
}

LinearRegressionView.prototype.bindAddDatapoint = function(onAddDatapoint) {
    var margin = this.configuration.margin;
    var view = this;

    //Bind the on add datapoint hook
    d3.select("svg").on("click", function(event) {
        //event contains information of click
        //Get coordinates from event
        var coords = d3.pointer(event);
        
        //Subtract out the margin to get x and y coordinates
        var x = coords[0] - margin;
        var y = coords[1] - margin;

        //x and y can be outside the graph (g element)'s domain
        //so the coordinates need checking
        if (x >= 0 && y >= 0) {
            //Render point
            view.renderPoint({ x, y });

            //Convert to correct coordinates
            var trueX = view.invertScaleX(x);
            var trueY = view.invertScaleY(y);

            //Call hook to pass coordinates
            onAddDatapoint({
                "x": trueX,
                "y": trueY
            });
        }
    });
}

LinearRegressionView.prototype.bindStartFit = function(onStartFit) {
    //Bind the on start fir hook
    this.onStartFit = onStartFit;
}


/* The Controller */
function LinearRegressionController(model, view) {
    //Set model and controller
    this.model = model;
    this.view = view;

    //Render the view
    this.view.render([], { m: 1, b: 0 });

    //Bind the model callbacks

    //Bind the view callbacks
    this.view.bindAddDatapoint(this.handleAddPoint.bind(this));
    this.view.bindClearDatapoints(this.handleClearPoints.bind(this));
}

LinearRegressionController.prototype.handleClearPoints = function() {
    //Handle clear points button click
    //Clear all datapoints from the model
    this.model.clearDatapoints();
}

LinearRegressionController.prototype.handleAddPoint = function(datapoint) {
    //Handle add points mouse click
    //datapoint is object of shape { x: ..., y: ... }
    this.model.addDatapoint(datapoint);
}

LinearRegressionController.prototype.handleStartFit = function() {
    //Handle start fit button click
}

LinearRegressionController.prototype.handleFit = function() {
    //Handle fit iteration
}

//Initialize application
const configuration = {
    width: 600,
    height: 600,
    margin: 50
}
Object.freeze(configuration);

const app = (function() {
    //Create view, model and controller
    var view = new LinearRegressionView(".graph__canvas", "#clear-points-button", "#start-fitting-button", configuration);
    var model =  new LinearRegressionModel();
    var controller = new LinearRegressionController(model, view);

    return {
        //Methods for application
    }
})();