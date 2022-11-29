//MVC Pattern

//Several neural network configurations
//ONE LAYER
var oneLayerConfiguration = (function() {
    var layers = [
        { type: "input", out_sx: 1, out_sy: 1, out_depth: 2 },
        { type: "fc", num_neurons: 6, activation: "tanh" },
        { type:"softmax", num_classes: 2 }
    ]

    var network = new convnetjs.Net();
    network.makeLayers(layers);

    var trainer = new convnetjs.SGDTrainer(
        network,
        {
            learning_rate: 0.1,
            momentum: 0.1,
            batch_size: 10,
            l2_decay: 0.01
        }
    )

    return {
        network,
        trainer
    };
})();

//TWO LAYERS
var twoLayerConfiguration = (function() {
    var layers = [
        { type: "input", out_sx: 1, out_sy: 1, out_depth: 2 },
        { type: "fc", num_neurons: 6, activation: "tanh" },
        { type: "fc", num_neurons: 2, activation: "tanh" },
        { type:"softmax", num_classes: 2 }
    ]

    var network = new convnetjs.Net();
    network.makeLayers(layers);

    var trainer = new convnetjs.SGDTrainer(
        network,
        {
            learning_rate: 0.1,
            momentum: 0.1,
            batch_size: 10,
            l2_decay: 0.01
        }
    )

    return {
        network,
        trainer
    };
})();

//THREE LAYERS
var threeLayerConfiguration = (function() {
    var layers = [
        { type: "input", out_sx: 1, out_sy: 1, out_depth: 2 },
        { type: "fc", num_neurons: 6, activation: "tanh" },
        { type: "fc", num_neurons: 6, activation: "tanh" },
        { type: "fc", num_neurons: 2, activation: "tanh" },
        { type:"softmax", num_classes: 2 }
    ]

    var network = new convnetjs.Net();
    network.makeLayers(layers);

    var trainer = new convnetjs.SGDTrainer(
        network,
        {
            learning_rate: 0.1,
            momentum: 0.1,
            batch_size: 10,
            l2_decay: 0.01
        }
    )

    return {
        network,
        trainer
    };
})();

//Logistic regression model
function NeuralNetworkModel(neuralNetworkConfiguration = oneLayerConfiguration) {
    //Cache a list of datapoints to train on
    this.datapoints = [];

    //Set network configuration
    this.configuration = neuralNetworkConfiguration;
}

NeuralNetworkModel.prototype.changeNetwork = function(networkArchitectureId) {
    //Change the neural network architecture based on id

    if (networkArchitectureId === 0) {
        this.configuration = oneLayerConfiguration;
    } else if (networkArchitectureId === 1) {
        this.configuration = twoLayerConfiguration;
    } else if (networkArchitectureId === 2) {
        this.configuration = threeLayerConfiguration;
    }
}

NeuralNetworkModel.prototype.onAddDatapoint = function(datapoint) {
    //On adding new datapoint to the dataset
    //datapoint is an object of shape { x:..., y:..., class:... }
    this.datapoints.push(datapoint);
}

NeuralNetworkModel.prototype.clearDatapoints = function() {
    //Clear all ddatapoints from the model
    //Set the datapoint cache to a new empty list
    this.datapoints = [];
}

NeuralNetworkModel.prototype.predict = function(datapoints) {
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
        var output = this.configuration.network.forward(input);
        var classLabel = output.w[0] >= output.w[1] ? 0 : 1;

        //Return an object of shape { x: ..., y: ... }
        labels.push(classLabel);
    }

    return labels;
}

NeuralNetworkModel.prototype.startFit = function() {
    //Start fitting the model

    //Define a training function
    var model = this;

    function train() {
        //Train over all examples        
        for (var i = 0; i != model.datapoints.length; ++i) {
            //Create a volume and assign to it the value of x
            var input = new convnetjs.Vol(1, 1, 2, 0.0);
            input.w[0] = model.datapoints[i].x;
            input.w[1] = model.datapoints[i].y;

            //Train based on the value of y
            model.configuration.trainer.train(input, model.datapoints[i].class);
        }

        //Call onFitIteration
        model.onFitIteration();
    }

    //Use setInterval to train the network many loops
    setInterval(train, 100);
}

NeuralNetworkModel.prototype.bindOnFitIteration = function(onFitIteration) {
    //Bind the on fit iteration hook
    this.onFitIteration = onFitIteration;
}


//Logistic regression view
function NeuralNetworkView(
    root, 
    clearButton, 
    trainButton, 
    redButton, 
    greenButton, 
    oneLayerButton,
    twoLayerButton,
    threeLayerButton,
    configuration
) {
    //Set the root for canvas
    this.root = root;

    //Set the buttons
    this.clearButton = clearButton;
    this.trainButton = trainButton;
    this.redButton = redButton;
    this.greenButton = greenButton;
    this.oneLayerButton = oneLayerButton;
    this.twoLayerButton = twoLayerButton;
    this.threeLayerButton = threeLayerButton;

    //Set configuration
    this.configuration = configuration;

    //Control input
    this.areButtonsDisabled = false;

    //Set current class
    // 0 is red
    // 1 is green
    this.currentClass = 0;
}

NeuralNetworkView.prototype.render = function() {
    //Render canvas and axes
    this.renderCanvas();
    this.renderAxes();
}

NeuralNetworkView.prototype.renderCanvas = function() {
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

NeuralNetworkView.prototype.renderAxes = function() {
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

NeuralNetworkView.prototype.renderPoint = function(datapoint) {
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

NeuralNetworkView.prototype.clearDatapoints = function() {
    //Remove all circles from the graph
    this.graph.selectAll("circle")
        .remove();
}

NeuralNetworkView.prototype.renderMask = function(labels) {
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

NeuralNetworkView.prototype.getMaskCoordinates = function() {
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

NeuralNetworkView.prototype.clearMask = function() {
    //Clear the transparent mask from graph

    //Remove all rectangles
    this.graph.selectAll("rect")
        .remove();
}

NeuralNetworkView.prototype.changeClass = function(classLabel) {
    //Change the current class of datapoint
    //classlabel can be 0 - Red class
    //or 1 - Green class
    this.currentClass = classLabel;
}

NeuralNetworkView.prototype.bindOnChangeClassToRed = function() {
    //Bind the hook when onChangeClassToRed button is clicked

    //Set view to this
    var view = this;

    d3.select(this.redButton)
        .on("click", function() {  
            view.changeClass(0) //Change class to 0 - Red
        });
}

NeuralNetworkView.prototype.bindOnChangeClassToGreen = function() {
    //Bind the hook when onChangeClassToGreen button is clicked

    //Set view to this
    var view = this;

    d3.select(this.greenButton)
        .on("click", function() {
            view.changeClass(1) //Change class to 1 - Green
        });
}

NeuralNetworkView.prototype.bindOnAddDatapoint = function(onAddDatapoint) {
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

NeuralNetworkView.prototype.bindOnClearDatapoints = function(onClearDatapoints) {
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

NeuralNetworkView.prototype.bindOnStartFit = function(onStartFit) {
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

NeuralNetworkView.prototype.bindOnOneLayerNetworkChosen = function(onOneLayerNetworkChosen) {
    //One fully connected layer network chosen

    //Set the view to this
    var view = this;

    d3.select(this.oneLayerButton)
        .on("click", function() {
            //Execute only if the fitting process has not begun
            if (!view.areButtonsDisabled) {
                onOneLayerNetworkChosen();
            }
        });
}

NeuralNetworkView.prototype.bindOnTwoLayerNetworkChosen = function(onTwoLayerNetworkChosen) {
    //Two fully connected layer network chosen

    //Set the view to this
    var view = this;

    d3.select(this.twoLayerButton)
        .on("click", function() {
            //Execute only if the fitting process has not begun
            if (!view.areButtonsDisabled) {
                onTwoLayerNetworkChosen();
            }
        });
}

NeuralNetworkView.prototype.bindOnThreeLayerNetworkChosen = function (onThreeLayerNetworkChosen) {
    //Three fully connected layer network chosen

    //Set the view to this
    var view = this;

    d3.select(this.threeLayerButton)
        .on("click", function() {
            //Execute only if the fitting process has not begun
            if (!view.areButtonsDisabled) {
                onThreeLayerNetworkChosen();
            }
        });
}

NeuralNetworkView.prototype.disableButtons = function() {
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

    d3.select(this.oneLayerButton)
        .node()
        .classList
        .add("button--disabled");

    d3.select(this.twoLayerButton)
        .node()
        .classList
        .add("button--disabled");

    d3.select(this.threeLayerButton)
        .node()
        .classList
        .add("button--disabled");
}

//Logistic regression controller
function NeuralNetworkController(model, view) {
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
    this.view.bindOnOneLayerNetworkChosen(this.handleOneLayerNetworkChosen.bind(this));
    this.view.bindOnTwoLayerNetworkChosen(this.handleTwoLayerNetworkChosen.bind(this));
    this.view.bindOnThreeLayerNetworkChosen(this.handleThreeLayerNetworkChosen.bind(this));
}

NeuralNetworkController.prototype.handleAddDatapoint = function(datapoint) {
    //Handle adding datapoint - Triggered when the view's canvas is clicked
    //datapoint is an object of shape { x:..., y:..., class:... }
    this.model.onAddDatapoint(datapoint);
}

NeuralNetworkController.prototype.handleClearDatapoints = function() {
    //Handle clear datapoints
    this.model.clearDatapoints();
}

NeuralNetworkController.prototype.handleStartFit = function() {
    //Handle on start fit
    this.model.startFit();

    //Disable inputs from view
    this.view.disableButtons();
}

NeuralNetworkController.prototype.handleFitIteration = function() {
    //Handle each iteration

    //Get the prediction of datapoints
    var inputs = this.view.getMaskCoordinates();
    var labels = this.model.predict(inputs);

    //Draw the mask according to the labels
    this.view.clearMask();
    this.view.renderMask(labels);
}

NeuralNetworkController.prototype.handleOneLayerNetworkChosen = function() {
    //Select one layer network 
    this.model.changeNetwork(0);
}

NeuralNetworkController.prototype.handleTwoLayerNetworkChosen = function() {
    //Select two layer network 
    this.model.changeNetwork(1);
}

NeuralNetworkController.prototype.handleThreeLayerNetworkChosen = function() {
    //Select three layer network 
    this.model.changeNetwork(2);
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
    var model = new NeuralNetworkModel();
    var view = new NeuralNetworkView(
        ".graph__canvas", 
        "#clear-points-button",
        "#start-fitting-button",
        "#select-red-button",
        "#select-green-button",
        "#one-layer-button",
        "#two-layer-button",
        "#three-layer-button",
        configuration
    );
    var controller = new NeuralNetworkController(model, view);

    console.log(view.getMaskCoordinates());

    return {
        //Methods for app
    }
})();