//MVC Pattern


//Logistic regression model
function LogisticRegressionModel() {
    //Cache a list of datapoints to train on
    this.datapoints = [];

    //Define logistic regression layers
    this.layers_definition = [
        { type: "input", out_sx: 1, out_sy: 1, out_depth: 1 },
        { type: "fc", num_neurons: 1, activation: "sigmoid" }, //Sigmoid activation
    ]

    //Create logistic regresion model
    this.network = new convnetjs.Net();
    this.network.makeLayers(this.layers_definition);

    //Create trainer
    this.trainer = new convnetjs.SGDTrainer(
        this.network,
        {
            learning_rate: 0.1,
            momentum: 0.1,
            batch_size: 10,
            l2_decay: 0.001
        }
    )
}

LogisticRegressionModel.prototype.onAddDatapoint = function(datapoint) {
    //On adding new datapoint to the dataset
    //datapoint is an object of shape { x:..., y:..., class:... }
    this.datapoints.push(datapoint);
}

LogisticRegressionModel.prototype.clearDatapoints = function() {
    //Clear all ddatapoints from the model

    //Set the datapoint cache to a new empty list
    this.datapoints = [];
}


//Logistic regression view
function LogisticRegressionView(
    root, 
    clearButton, 
    trainButton, 
    redButton, 
    greenButton, 
    configuration
) {
    //Set the root for canvas
    this.root = root;

    //Set the buttons
    this.clearButton = clearButton;
    this.trainButton = trainButton;
    this.redButton = redButton;
    this.greenButton = greenButton;

    //Set configuration
    this.configuration = configuration;

    //Set current class
    // 0 is red
    // 1 is green
    this.currentClass = 0;
}

LogisticRegressionView.prototype.render = function() {
    //Render canvas and axes
    this.renderCanvas();
    this.renderAxes();
    this.renderMask();
}

LogisticRegressionView.prototype.renderCanvas = function() {
    //Render the initial canvas layout

    //Get the configuration data
    var { width, height, margin } = this.configuration;

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

LogisticRegressionView.prototype.renderAxes = function() {
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

LogisticRegressionView.prototype.renderPoint = function(datapoint) {
    //Render a datapoint onto the graph
    //datapoint is an object of shape { x:..., y:..., class:... }

    //Get x and y coordinate from graph
    var x = datapoint.x;
    var y = datapoint.y;
    var classLabel = datapoint.class;

    //Draw datapoint
    this.graph.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 10)
        .style("fill", classLabel === 0 ? "#EF233C" : "#70E000");
}

LogisticRegressionView.prototype.clearDatapoints = function() {
    //Remove all circles from the graph
    this.graph.selectAll("circle")
        .remove();
}

LogisticRegressionView.prototype.renderMask = function() {
    //Render a transparent that tells what class a single datapoint is

    //Get the width, height of graph, and the mask size from configuration
    var margin = this.configuration.margin;
    var width = this.configuration.width - margin * 2;
    var height = this.configuration.height - margin * 2;
    var mask = this.configuration.mask;

    //Render a transparent mask by drawing rectangle with opacity
    for (var r = 0; r < height / mask; ++r) {
        for (var c = 0; c < width / mask; ++c) {
            //Get the current position of the rectangle
            var currentHeight = r * mask;
            var currentWidth = c * mask;

            //Draw a rectangle
            this.graph.append("rect")
                .attr("x", currentWidth)
                .attr("y", currentHeight)
                .attr("width", mask)
                .attr("height", mask)
                .attr("stroke", "transparent")
                .attr("fill", "#70E000")
                .style("opacity", 0.25);
        }
    }
}

LogisticRegressionView.prototype.changeClass = function(classLabel) {
    //Change the current class of datapoint
    //classlabel can be 0 - Red class
    //or 1 - Green class
    this.currentClass = classLabel;
}

LogisticRegressionView.prototype.bindOnChangeClassToRed = function() {
    //Bind the hook when onChangeClassToRed button is clicked

    //Set view to this
    var view = this;

    d3.select(this.redButton)
        .on("click", function(event) {  
            view.changeClass(0) //Change class to 0 - Red
        });
}

LogisticRegressionView.prototype.bindOnChangeClassToGreen = function() {
    //Bind the hook when onChangeClassToGreen button is clicked

    //Set view to this
    var view = this;

    d3.select(this.greenButton)
        .on("click", function(event) {
            view.changeClass(1) //Change class to 1 - Green
        });
}

LogisticRegressionView.prototype.bindOnAddDatapoint = function(onAddDatapoint) {
    var margin = this.configuration.margin;
    var view = this;

    //Bind the on add datapoint hook
    d3.select("svg").on("click", function(event) {
        //Add datapoint if the button are not disabled
        if (!view.areButtonsDisabled) {
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
                view.renderPoint({ x, y, class: view.currentClass });

                //Convert to correct coordinates
                var trueX = view.invertScaleX(x);
                var trueY = view.invertScaleY(y);

                //Call hook to pass coordinates and current label for the class
                onAddDatapoint({
                    "x": trueX,
                    "y": trueY,
                    "class": view.currentClass
                });
            }
        }
    });
}

LogisticRegressionView.prototype.bindOnClearDatapoints = function(onClearDatapoints) {
    //Bind on clear datapoints hook

    //Set the view to this
    var view = this;

    d3.select(this.clearButton)
        .on("click", function() {
            //Call clear datapoints on view
            view.clearDatapoints();
            onClearDatapoints();
        });
}


//Logistic regression controller
function LogisticRegressionController(model, view) {
    //Set model and view
    this.model = model;
    this.view = view;

    //Render the view
    this.view.render();

    //Bind the view
    this.view.bindOnChangeClassToRed();
    this.view.bindOnChangeClassToGreen();
    this.view.bindOnAddDatapoint(this.handleAddDatapoint.bind(this));
    this.view.bindOnClearDatapoints(this.handleClearDatapoints.bind(this));
}

LogisticRegressionController.prototype.handleAddDatapoint = function(datapoint) {
    //Handle adding datapoint - Triggered when the view's canvas is clicked
    //datapoint is an object of shape { x:..., y:..., class:... }

    this.model.onAddDatapoint(datapoint);
}

LogisticRegressionController.prototype.handleClearDatapoints = function() {
    //Handle clear datapoints

    this.model.clearDatapoints();
}

//Configuration and app
var configuration = {
    width: 600,
    height: 600,
    margin: 50,
    mask: 25
}
Object.freeze(configuration);

var app = (function() {
    var model = new LogisticRegressionModel();
    var view = new LogisticRegressionView(
        ".graph__canvas", 
        "#clear-points-button",
        "#start-fitting-button",
        "#select-red-button",
        "#select-green-button",
        configuration
    );
    var controller = new LogisticRegressionController(model, view);

    return {
        //Methods for app
    }
})();