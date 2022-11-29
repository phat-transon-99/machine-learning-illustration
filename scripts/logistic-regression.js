//MVC Pattern


//Logistic regression model
function LogisticRegressionModel() {
    //Cache a list of datapoints to train on
    this.datapoints = [];

    //Define logistic regression layers
    this.layers_definition = [
        { type: "input", out_sx: 1, out_sy: 1, out_depth: 2 },
        { type: "fc", num_neurons: 2, activation: "tanh" }, //No activation
        { type:"softmax", num_classes: 2 }
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
            l2_decay: 0.01
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

LogisticRegressionModel.prototype.predict = function(datapoints) {
    //Predict an output for an input array
    //datapoint is an input array of shape [{ x: ..., y:... }]
    //labels is an input of prediction

    var labels = []

    for (var datapoint of datapoints) {
        var { x, y } = datapoint;

        var input = new convnetjs.Vol(1, 1, 2, 0.0);
        input.w[0] = x;
        input.w[1] = y;

        //Forward to get value of y
        var output = this.network.forward(input);
        var classLabel = output.w[0] >= output.w[1] ? 0 : 1;

        //Return an object of shape { x: ..., y: ... }
        labels.push(classLabel);
    }

    return labels;
}

LogisticRegressionModel.prototype.startFit = function() {
    //Start fitting the model

    //Define a training function
    var model = this;

    function train() {
        //Initialize the average cost
        var loss = 0;

        //Train over all examples        
        for (var i = 0; i != model.datapoints.length; ++i) {
            //Create a volume and assign to it the value of x
            var input = new convnetjs.Vol(1, 1, 2, 0.0);
            input.w[0] = model.datapoints[i].x;
            input.w[1] = model.datapoints[i].y;

            //Train based on the value of y
            //stats holds the current cost of this iteration
            var stats = model.trainer.train(input, model.datapoints[i].class);

            //Add to average costs
            loss += stats.loss;
        }

        //Call onFitIteration, pass in the average cost of the current iteration
        model.onFitIteration(loss / model.datapoints.length);
    }

    //Use setInterval to train the network many loops
    setInterval(train, 100);
}

LogisticRegressionModel.prototype.bindOnFitIteration = function(onFitIteration) {
    //Bind the on fit iteration hook
    //onFitIteration is a function of type function(loss)
    this.onFitIteration = onFitIteration;
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

    //Control input
    this.areButtonsDisabled = false;

    //Set current class
    // 0 is red
    // 1 is green
    this.currentClass = 0;
}

LogisticRegressionView.prototype.render = function() {
    //Render canvas and axes
    this.renderCanvas();
    this.renderAxes();
    this.renderScore();
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
        .domain([0, 1])
        .range([0, width]);

    this.invertScaleX = d3.scaleLinear()
        .domain([0, width])
        .range([0, 1]);

    this.scaleY = d3.scaleLinear()
        .domain([0, 1])
        .range([height, 0])

    this.invertScaleY = d3.scaleLinear()
        .domain([height, 0])
        .range([0, 1])

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

LogisticRegressionView.prototype.renderMask = function(labels) {
    //Render a transparent that tells what class a single datapoint is
    //labels is an array of output label

    //Get the width, height of graph, and the mask size from configuration
    var margin = this.configuration.margin;
    var width = this.configuration.width - margin * 2;
    var height = this.configuration.height - margin * 2;
    var mask = this.configuration.mask;

    //Render a transparent mask by drawing rectangle with opacity
    var currentLabelIndex = 0;

    for (var r = 0; r < height / mask; ++r) {
        for (var c = 0; c < width / mask; ++c) {
            //Get the current position of the rectangle
            var currentHeight = r * mask;
            var currentWidth = c * mask;

            //Get the label
            var currentLabel = labels[currentLabelIndex];

            //Draw a rectangle
            this.graph.append("rect")
                .attr("x", currentWidth)
                .attr("y", currentHeight)
                .attr("width", mask)
                .attr("height", mask)
                .attr("stroke", "transparent")
                .attr("fill", currentLabel === 0 ? "#EF233C" : "#70E000")
                .style("opacity", 0.25);

            //Move on to next label
            currentLabelIndex += 1;
        }
    }
}

LogisticRegressionView.prototype.getMaskCoordinates = function() {
    //Get the coordinates of starting position on mask tiles
    //coordinates is an array of shape [{ x:..., y:... }]
    var coordinates = [];

    var margin = this.configuration.margin;
    var width = this.configuration.width - margin * 2;
    var height = this.configuration.height - margin * 2;
    var mask = this.configuration.mask;

    //Render a transparent mask by drawing rectangle with opacity
    for (var r = 0; r < height / mask; ++r) {
        for (var c = 0; c < width / mask; ++c) {
            //Get the current position of the rectangle
            var currentHeight = this.invertScaleY(r * mask);
            var currentWidth = this.invertScaleX(c * mask);

            //Append to coordinate list
            coordinates.push({
                x: currentWidth,
                y: currentHeight
            })
        }
    }

    return coordinates;
}

LogisticRegressionView.prototype.clearMask = function() {
    //Clear the transparent mask from graph

    //Remove all rectangles
    this.graph.selectAll("rect")
        .remove();
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
        .on("click", function() {  
            view.changeClass(0) //Change class to 0 - Red
        });
}

LogisticRegressionView.prototype.bindOnChangeClassToGreen = function() {
    //Bind the hook when onChangeClassToGreen button is clicked

    //Set view to this
    var view = this;

    d3.select(this.greenButton)
        .on("click", function() {
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
            //Excute if the fitting process has not begun
            if (!view.areButtonsDisabled) {
                //Call clear datapoints on view
                view.clearDatapoints();
                onClearDatapoints();
            }
        });
}

LogisticRegressionView.prototype.bindOnStartFit = function(onStartFit) {
    //Bind on start fit hook

    //Set the view to this
    var view = this;

    d3.select(this.trainButton)
        .on("click", function() {
            //Execute only if the fitting process has not begun
            if (!view.areButtonsDisabled) {
                onStartFit();
            }
        });
}

LogisticRegressionView.prototype.disableButtons = function() {
    //Disable inputs when training
    this.areButtonsDisabled = true;

    //Disable buttons by adding disable button class
    d3.select(this.clearButton)
        .node()
        .classList
        .add("button--disabled");

    d3.select(this.trainButton)
        .node()
        .classList
        .add("button--disabled");

    d3.select(this.redButton)
        .node()
        .classList
        .add("button--disabled");

    d3.select(this.greenButton)
        .node()
        .classList
        .add("button--disabled");  
}

LogisticRegressionView.prototype.renderScore = function(score = 0) {
    //Render score onto the graph
    //Score is a floating point number
    this.text = d3.select(this.root)
        .select("svg")
        .append("g");

    this.text.append("text")
            .attr("class", "score-text")
            .attr("x", 180)
            .attr("y", 25)
            .text(`Current score: ${score}`);
}

LogisticRegressionView.prototype.clearScore = function() {
    //Clear the current score from graph
    this.text.remove();
}

//Logistic regression controller
function LogisticRegressionController(model, view) {
    //Set model and view
    this.model = model;
    this.view = view;

    //Render the view
    this.view.render();

    //Bind the model
    this.model.bindOnFitIteration(this.handleFitIteration.bind(this));

    //Bind the view
    this.view.bindOnChangeClassToRed();
    this.view.bindOnChangeClassToGreen();
    this.view.bindOnAddDatapoint(this.handleAddDatapoint.bind(this));
    this.view.bindOnClearDatapoints(this.handleClearDatapoints.bind(this));
    this.view.bindOnStartFit(this.handleStartFit.bind(this));
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

LogisticRegressionController.prototype.handleStartFit = function() {
    //Handle on start fit
    this.model.startFit();

    //Disable inputs from view
    this.view.disableButtons();
}

LogisticRegressionController.prototype.handleFitIteration = function(loss) {
    //Handle each iteration

    //Get the prediction of datapoints
    var inputs = this.view.getMaskCoordinates();
    var labels = this.model.predict(inputs);

    //Draw the mask according to the labels
    this.view.clearMask();
    this.view.renderMask(labels);

    //Render the score
    this.view.clearScore();
    this.view.renderScore(loss);
}

//Configuration and app
var configuration = {
    width: 600,
    height: 600,
    margin: 50,
    mask: 10
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

    console.log(view.getMaskCoordinates());

    return {
        //Methods for app
    }
})();