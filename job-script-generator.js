/*****************************************************************\

Copyright (C) 2014, Brigham Young University

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.

*******************************************************************

Available at: https://github.com/BYUHPC/BYUJobScriptGenerator

Author:  Ryan Cox <ryan_cox@byu.edu>

This script generator was originally created for Brigham Young University and
is tailored to its specific needs and configuration.  It is unlikely that this
script will work for you without modification since there are many, many ways
to configure a job scheduler.

This should integrate easily into any existing website.  Use CSS for styling.

TODO:
	job arrays
	tooltip/help for each parameter row

\*****************************************************************/


var ScriptGen = function(div) {
	this.values = {};
	this.containerDiv = div;
	this.inputs = {};
	this.inputs.features = {};
	this.formrows = [];
	this.settings = {
		// script_formats = [ ["htmlname1", "Text1"], ["htmlname2", "Text2"], ... ]
		script_formats : [ ["slurm", "Slurm"], ["pbs", "PBS"] ], // first is default
		defaults : {
			email_address : "myemail@example.com", //example.com should be blackholed
		},
		qos : {
			preemptable : "standby",
			test : "test"
		},
		/* You may want to dynamically generate features/queues. See example HTML file */
		features : {},
		features_status : {},
		queues : {},
		queues_status : {},
	};
	return this;
};

// Function to create table element
ScriptGen.prototype.returnNewRow = function (rowid, left, right) {
	var l, r, tr;
	l = document.createElement("td");
	r = document.createElement("td");
	tr = document.createElement("tr");
	l.id = rowid + "_left";
	r.id = rowid + "_right";
	tr.id = rowid;
	l.innerHTML = left;
	r.appendChild(right)
	tr.appendChild(l);
	tr.appendChild(r);
	return tr;
}

// Function to create table element
ScriptGen.prototype.newCheckbox = function(args) {
	var tthis = this;
	var newEl = document.createElement("input");
	newEl.type = "checkbox";
	var formrows = this.formrows;
	if(args.checked)
		newEl.checked = true;
	if(args.toggle)
		newEl.onclick = newEl.onchange = function () {
			formrows[args.toggle].style.display = newEl.checked ? "" : "none";
			tthis.updateJobscript();
		};
	else
		newEl.onclick = newEl.onchange = function () {
			tthis.updateJobscript();
		};
	return newEl;
}

// Function to create table element
ScriptGen.prototype.newInput = function(args) {
	var tthis = this;
	var newEl = document.createElement("input");
	newEl.type = "text";
	if(args.size)
		newEl.size = args.size;
	if(args.maxLength)
		newEl.maxLength = args.maxLength;
	if(args.value)
		newEl.value = args.value;
	newEl.onclick = newEl.onchange = function () {
		tthis.updateJobscript();
	};
	return newEl;
}

// Function to create table element
ScriptGen.prototype.newSelect = function(args) {
	var tthis = this;
	var newEl = document.createElement("select");
	if(args.options) {
		for(var i in args.options) {
			var newOpt = document.createElement("option");
			newOpt.value = args.options[i][0];
			newOpt.text = args.options[i][1];
			if(args.selected && args.selected == args.options[i][0])
				newOpt.selected = true;
			newEl.appendChild(newOpt);
		}
	}
	newEl.onclick = newEl.onchange = function () {
		tthis.updateJobscript();
	};
	return newEl;
}

// Function to create table element
ScriptGen.prototype.newSpan = function() {
	var newEl = document.createElement("span");
	if(arguments[0])
		newEl.id = arguments[0];
	for (var i = 1; i < arguments.length; i++) {
		if(typeof arguments[i] == "string") {
			newEl.appendChild(document.createTextNode(arguments[i]));
		} else
			newEl.appendChild(arguments[i]);
	}
	return newEl;
};

// Function to create table element
ScriptGen.prototype.newA = function(url, body) {
	var a = document.createElement("a");
	a.href = url;
	a.appendChild(document.createTextNode(body));
	a.target = "_base";
	return a;
}

ScriptGen.prototype.createForm = function(doc) {
	function br() {
		return document.createElement("br");
	}
	function newHeaderRow(text) {
		var headertr = document.createElement("tr");
		var headerth = document.createElement("th");
		headerth.colSpan = 2;
		headerth.appendChild(document.createTextNode(text));
		headertr.appendChild(headerth);
		return headertr;
	}

    var input_box_width = 6;

	var newEl;
	form = document.createElement("form");
	var table = document.createElement("table");
	form.appendChild(table);
	table.appendChild(newHeaderRow("Parameters"));

    // In Use
    this.inputs.merge_error_output = this.newCheckbox({checked:0});
    this.inputs.num_nodes = this.newInput({value:1, size: input_box_width});
    this.inputs.num_cores = this.newInput({value:1, size: input_box_width});
	this.inputs.num_gpus = this.newInput({value:0, size: input_box_width});
    this.inputs.wallhours = this.newInput({value:"1", size: input_box_width});
	this.inputs.wallmins = this.newInput({value:"00", size: input_box_width, maxLength:2});
	this.inputs.wallsecs = this.newInput({value:"00", size: input_box_width, maxLength:2});
    this.inputs.job_name = this.newInput({value: "my_job_name"});
    this.inputs.project_code = this.newInput({});

	this.inputs.email_begin = this.newCheckbox({checked:0});
	this.inputs.email_end = this.newCheckbox({checked:0});
	this.inputs.email_abort = this.newCheckbox({checked:0});
	this.inputs.email_address = this.newInput({value:this.settings.defaults.email_address});


    table.appendChild(this.returnNewRow("row_num_nodes", "Number of nodes: ", this.inputs.num_nodes));
	table.appendChild(this.returnNewRow("row_num_cores", "Number of cores: ", this.inputs.num_cores));
	table.appendChild(this.returnNewRow("row_num_gpus", "Number of GPUs: ", this.inputs.num_gpus));
	table.appendChild(this.returnNewRow("row_walltime", "Walltime: ", this.newSpan(null, this.inputs.wallhours, " hours ", this.inputs.wallmins, " mins ", this.inputs.wallsecs, " secs")));
    table.appendChild(this.returnNewRow("row_merge_error_output", "Merge output and error files: ", this.inputs.merge_error_output));
    table.appendChild(this.returnNewRow("row_job_name", "Job name: ", this.inputs.job_name));
    table.appendChild(this.returnNewRow("row_project_code", "Project Code: ", this.inputs.project_code));
    table.appendChild(this.returnNewRow("row_email_events", "Receive email for job events: ", 
	    this.newSpan(null, this.inputs.email_begin, " begin ", this.inputs.email_end, " end ", 
        this.inputs.email_abort, " abort")
	));
	table.appendChild(this.returnNewRow("row_email_address", "Email address: ", this.inputs.email_address));
    this.inputs.queues = [];
	if(this.settings.queues.show) {
		var queues_span = this.newSpan("byu_sg_input_queues");
		for(var i in this.settings.queues.names) {
			var new_checkbox = this.newCheckbox({checked:0});
			new_checkbox.partition_name = this.settings.queues.names[i];
			this.inputs.queues.push(new_checkbox);
			var url = this.newA(this.settings.queues.info_base_url + this.settings.queues.names[i], "?");
			var partition_container = this.newSpan(null);
			partition_container.className = "byu_sg_input_partition_container";
			var name_span = this.newSpan("byu_sg_input_partition_" + new_checkbox.partition_name, new_checkbox, this.settings.queues.names[i] + " [", url, "]");
			name_span.className = "byu_sg_input_partition_name";
			partition_container.appendChild(name_span);
			if(this.settings.queues_status && this.settings.queues_status[this.settings.queues.names[i]]) {
				var partition_status = this.settings.queues_status[this.settings.queues.names[i]];
				partition_container.appendChild(
					this.newSpan(	null,
							"Nodes avail: ",
							partition_status.nodes_free + "/" + partition_status.nodes_total,
							br(),
							"Cores avail: ",
							partition_status.cores_free + "/" + partition_status.cores_total
					)
				);
			}
			queues_span.appendChild(partition_container);
		}
		table.appendChild(this.returnNewRow("byu_sg_input_queues", "queues: ", queues_span));
	}


    // Deprecated
    this.inputs.single_node = this.newCheckbox({checked:1});
	this.inputs.mem_per_core = this.newInput({value:1, size: input_box_width});
	this.inputs.mem_units = this.newSelect({options:[["gb", "gb"],["mb", "mb"]]});
	this.inputs.is_test = this.newCheckbox({checked:0});
	this.inputs.is_preemptable = this.newCheckbox({checked:0, toggle:"is_requeueable"});
	this.inputs.is_requeueable = this.newCheckbox({checked:0});
	this.inputs.in_group = this.newCheckbox({checked:0, toggle:"group_name"});
	this.inputs.group_name = this.newInput({value:"MYGROUPNAME"});
	this.inputs.need_licenses = this.newCheckbox({checked:0, toggle:"licenses"});
	this.inputs.lic0_name = this.newInput({});
	this.inputs.lic0_count = this.newInput({size:3, maxLength:4});
	this.inputs.lic1_name = this.newInput({});
	this.inputs.lic1_count = this.newInput({size:3, maxLength:4});
	this.inputs.lic2_name = this.newInput({});
	this.inputs.lic2_count = this.newInput({size:3, maxLength:4});
	// table.appendChild(this.returnNewRow("byu_sg_row_onenode", "Limit this job to one node: ", this.inputs.single_node));
	// table.appendChild(this.returnNewRow("row_mem_per_core", "Memory per processor core: ", this.newSpan(null, this.inputs.mem_per_core, this.inputs.mem_units)));
	// table.appendChild(this.returnNewRow("byu_sg_row_testjob", "Job is a <b>test</b> job: ", this.inputs.is_test));
	// table.appendChild(this.returnNewRow("byu_sg_row_preemptable", "Job is preemptable: ", this.inputs.is_preemptable));
	// table.appendChild(this.formrows["is_requeueable"] = this.returnNewRow("byu_sg_row_requeueable", "Job is requeueable: ", this.inputs.is_requeueable));
	// this.formrows["is_requeueable"].style.display = "none";
	// table.appendChild(this.returnNewRow("byu_sg_row_fsgroup", "I am in a file sharing group and my group members need <br/>to read/modify my output files: ", this.inputs.in_group));
	// table.appendChild(this.formrows["group_name"] = this.returnNewRow("byu_sg_row_fsgroupname", "Group name (case sensitive): ", this.inputs.group_name));
	// this.formrows["group_name"].style.display = "none";
	// table.appendChild(this.returnNewRow("byu_sg_row_needlicenses", "Need licenses? ", this.inputs.need_licenses));
	// table.appendChild(this.formrows["licenses"] = this.returnNewRow("byu_sg_row_licenses",
	// 				"Licenses: ", this.newSpan(	null,
	// 								"Name ", this.inputs.lic0_name, " Count ", this.inputs.lic0_count, br(),
	// 								"Name ", this.inputs.lic1_name, " Count ", this.inputs.lic1_count, br(),
	// 								"Name ", this.inputs.lic2_name, " Count ", this.inputs.lic2_count
	// 							)
	// 				)
	// );
	// this.formrows["licenses"].style.display = "none";
	// this.inputs.features = [];
	// if(this.settings.features.show) {
	// 	var features_span = this.newSpan("byu_sg_input_features");
	// 	for(var i in this.settings.features.names) {
	// 		var new_checkbox = this.newCheckbox({checked:0});
	// 		new_checkbox.feature_name = this.settings.features.names[i];
	// 		this.inputs.features.push(new_checkbox);
	// 		var url = this.newA(this.settings.features.info_base_url + this.settings.features.names[i], "?");
	// 		var feature_container = this.newSpan(null);
	// 		feature_container.className = "byu_sg_input_feature_container";
	// 		var name_span = this.newSpan("byu_sg_input_feature_" + new_checkbox.feature_name, new_checkbox, this.settings.features.names[i] + " [", url, "]");
	// 		name_span.className = "byu_sg_input_feature_name";
	// 		feature_container.appendChild(name_span);
	// 		if(this.settings.features_status && this.settings.features_status[this.settings.features.names[i]]) {
	// 			var feature_status = this.settings.features_status[this.settings.features.names[i]];
	// 			feature_container.appendChild(
	// 				this.newSpan(	null,
	// 						"Nodes avail: ",
	// 						feature_status.nodes_free + "/" + feature_status.nodes_total,
	// 						br(),
	// 						"Cores avail: ",
	// 						feature_status.cores_free + "/" + feature_status.cores_total
	// 				)
	// 			);
	// 		}
	// 		features_span.appendChild(feature_container);
	// 	}
	// 	table.appendChild(this.returnNewRow("byu_sg_input_features", "Features: ", features_span));
	// }

	return form;

};

ScriptGen.prototype.retrieveValues = function() {
	var jobnotes = [];
	this.values.MB_per_core = Math.round(this.inputs.mem_per_core.value * (this.inputs.mem_units.value =="gb" ? 1024 : 1));

	this.values.features = [];
	for(var i in this.inputs.features) {
		if(this.inputs.features[i].checked){
			this.values.features.push(this.inputs.features[i].feature_name);
		} else {
		}
	}

	this.values.queues = [];
	for(var i in this.inputs.queues) {
		if(this.inputs.queues[i].checked){
			this.values.queues.push(this.inputs.queues[i].partition_name);
		} else {
		}
	}

	this.values.is_test = this.inputs.is_test.checked;
    this.values.merge_error_output = this.inputs.merge_error_output;
	this.values.is_preemptable = this.inputs.is_preemptable.checked;
	this.values.is_requeueable = this.inputs.is_requeueable && this.inputs.is_requeueable.checked;
	this.values.walltime_in_minutes = this.inputs.wallhours.value * 3600 + this.inputs.wallmins.value * 60;
	this.values.num_cores = this.inputs.num_cores.value;
    this.values.num_nodes = this.inputs.num_nodes.value;
	if(this.inputs.single_node.checked)
		this.values.nodes = 1;
	this.values.gpus = this.inputs.num_gpus.value
	this.values.job_name = this.inputs.job_name.value;
	this.values.sendemail = {};
	this.values.sendemail.begin = this.inputs.email_begin.checked;
	this.values.sendemail.end = this.inputs.email_end.checked;
	this.values.sendemail.abort = this.inputs.email_abort.checked;
	this.values.email_address = this.inputs.email_address.value;
    this.values.project_code = this.inputs.project_code.value;

	/* Add warnings, etc. to jobnotes array */
	if(this.values.MB_per_core > 20*1024*1024)
		jobnotes.push("Are you crazy? That is way too much RAM!");
	if(this.values.walltime_in_minutes > 86400*7)
		jobnotes.push("Global maximum walltime is 7 days");
	// if(this.values.walltime_in_minutes > 86400*3 && this.values.queues.indexOf("p2") > -1)
	// 	jobnotes.push("Partition p2 maximum walltime is 3 days");
	// if(this.values.MB_per_core > 24*1024 && this.values.queues.indexOf("p1") > -1)
	// 	jobnotes.push("Partition p1 nodes have 24 GB of RAM. You want more than that per core");

	this.jobNotesDiv.innerHTML = jobnotes.join("<br/>\n");
};

ScriptGen.prototype.generateScriptPBS = function () {
	this.retrieveValues();

	var script = "#!/bin/bash\n\n#Submit this script with: qsub thefilename\n\n";
	var walltime = "walltime=" + this.inputs.wallhours.value + ":" + this.inputs.wallmins.value + ":" + this.inputs.wallsecs.value;

    var procs = `select=${this.values.num_nodes}:ncpus=${this.values.num_cores}`;

	if(this.inputs.num_gpus.value > 0)
		procs += ":ngpus=" + this.inputs.num_gpus.value;

	script += `#PBS -l ${procs}:mem=${this.inputs.mem_per_core.value}${this.inputs.mem_units.value}\n`;
    script += `#PBS -l ${walltime}\n`

    if(this.inputs.merge_error_output.checked){
        script += `#PBS -j oe\n`;
    }
	if(this.values.queues.length > 0){
		script += "#PBS -q " + this.values.queues[0] + "\n";
    }
	if(this.inputs.job_name.value != "") {
		script += "#PBS -N " + this.inputs.job_name.value + "\n";
	}
    if(this.inputs.project_code.value != "") {
		script += "#PBS -P " + this.inputs.project_code.value + "\n";
	}
	if(this.inputs.need_licenses.checked) {
		var lics = new Array();
		var show_lics = 0;
		if(this.inputs.lic0_name.value != "" && this.inputs.lic0_count.value > 0) {
			lics.push(this.inputs.lic0_name.value + "+" + this.inputs.lic0_count.value);
			show_lics = 1;
		}
		if(this.inputs.lic1_name.value != "" && this.inputs.lic1_count.value > 0) {
			lics.push(this.inputs.lic1_name.value + "+" + this.inputs.lic1_count.value);
			show_lics = 1;
		}
		if(this.inputs.lic2_name.value != "" && this.inputs.lic2_count.value > 0) {
			lics.push(this.inputs.lic2_name.value + "+" + this.inputs.lic2_count.value);
			show_lics = 1;
		}
		if(show_lics)
			script += "#PBS -W x=GRES:" + lics.join("%") + "   #format: lic1_name+lic1_count%lic2_name+lic2_count\n";
	}

	if(this.inputs.email_begin.checked || this.inputs.email_end.checked || this.inputs.email_abort.checked) {
		var emailletters = [];
		if(this.inputs.email_begin.checked)
			emailletters.push("b");
		if(this.inputs.email_end.checked)
			emailletters.push("e");
		if(this.inputs.email_abort.checked)
			emailletters.push("a");
		script += "#PBS -m " + emailletters.join("") + "\n";
		script += "#PBS -M " + this.inputs.email_address.value + "\n";
		if(this.inputs.email_address.value == this.settings.defaults.email_address)
			script += "echo \"$USER: Please change the -M option to your real email address before submitting. Then remove this line.\"; exit 1\n";
	}

	var requeueable = this.inputs.is_requeueable.checked ? "#PBS -r y    # Job can be requeued if it is preempted\n" : "";
	script += requeueable;

	if(this.inputs.in_group.checked) {
		script += "\n# Set the output permissions on the .oJOBID and .eJOBID files to be 0660 (owner and group can read/write but not others)\n";
		script += "#PBS -W umask=0007\n";
		script += "\n# Set the group ownership on the .oJOBID and .eJOBID files to be '" + this.inputs.group_name.value +"'\n";
		script += "#PBS -W group_list=" + this.inputs.group_name.value + "\n";
		script += "\n# Set the output permissions on files written from my scriptipt to be 0660 and directories to be 0770 (owner and group can read/write but not others)\n";
		script += "umask 0007\n";
	}
	script += "\n# LOAD MODULES, INSERT CODE, AND RUN YOUR PROGRAMS HERE\n";

	return script;
};


ScriptGen.prototype.generateScriptSLURM = function () {
	var pbscompat = true;
	var pmemmb;
	var procs;
	var features = "";

	var script = "#!/bin/bash\n\n#Submit this script with: sbatch thefilename\n\n";
	var sbatch = function sbatch(txt) {
		script += "#SBATCH " + txt + "\n";
	};
	
	sbatch("--time=" + this.inputs.wallhours.value + ":" + this.inputs.wallmins.value + ":" + this.inputs.wallsecs.value + "   # walltime");
	
	sbatch("--ntasks=" + this.values.num_cores + "   # number of processor cores (i.e. tasks)");
	if(this.inputs.single_node.checked) {
		sbatch("--nodes=" + this.values.num_nodes + "  # number of nodes");
	}

	if(this.inputs.num_gpus.value > 0) {
		sbatch("--gres=gpu:" + this.inputs.num_gpus.value);
	}

	if(this.values.features.length > 0) {
		var features = this.values.features.join("&");
		sbatch("-C '" + features + "'   # features syntax (use quotes): -C 'a&b&c&d'");
	}
	if(this.values.queues.length > 0) {
		var queues = this.values.queues.join(",");
		sbatch("-p " + queues + "   # partition(s)");
	}

	sbatch("--mem-per-cpu=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value.substr(0,1) + "   # memory per CPU core");

	if(this.inputs.job_name.value && this.inputs.job_name.value != "") {
		sbatch("-J \"" + this.inputs.job_name.value + "\"   # job name");
	}
	
	if(this.inputs.email_begin.checked || this.inputs.email_end.checked || this.inputs.email_abort.checked) {
		sbatch("--mail-user=" + this.values.email_address + "   # email address");
		if(this.inputs.email_address.value == this.settings.defaults.email_address)
			script += "echo \"$USER: Please change the --mail-user option to your real email address before submitting. Then remove this line.\"; exit 1\n";
		if(this.inputs.email_begin.checked)
			sbatch("--mail-type=BEGIN");
		if(this.inputs.email_end.checked)
			sbatch("--mail-type=END");
		if(this.inputs.email_abort.checked)
			sbatch("--mail-type=FAIL");
	}
	if(this.inputs.is_preemptable.checked)
		sbatch("--qos=" + this.settings.qos.preemptable);
	else if(this.inputs.is_test.checked)
		sbatch("--qos=" + this.settings.qos.test);
	if(this.inputs.is_requeueable.checked)
		sbatch("--requeue   #requeue when preempted and on node failure");
	if(this.inputs.need_licenses.checked) {
		var lics = new Array();
		var show_lics = 0;
		if(this.inputs.lic0_name.value != "" && this.inputs.lic0_count.value > 0) {
			lics.push(this.inputs.lic0_name.value + ":" + this.inputs.lic0_count.value);
			show_lics = 1;
		}
		if(this.inputs.lic1_name.value != "" && this.inputs.lic1_count.value > 0) {
			lics.push(this.inputs.lic1_name.value + ":" + this.inputs.lic1_count.value);
			show_lics = 1;
		}
		if(this.inputs.lic2_name.value != "" && this.inputs.lic2_count.value > 0) {
			lics.push(this.inputs.lic2_name.value + ":" + this.inputs.lic2_count.value);
			show_lics = 1;
		}
		if(show_lics)
			sbatch("--licenses=" + lics.join(",") + "   #format: lic1_name:lic1_count,lic2_name:lic2_count");
	}
	if(this.inputs.in_group.checked) {
		sbatch("--gid=" + this.inputs.group_name.value);
	}


	script += "\n\n# LOAD MODULES, INSERT CODE, AND RUN YOUR PROGRAMS HERE\n";
	return script;
};

function stackTrace() {
    var err = new Error();
    return err.stack;
}

ScriptGen.prototype.updateJobscript = function() {
	this.retrieveValues();
	this.toJobScript();
	return;
};

ScriptGen.prototype.init = function() {
	this.inputDiv = document.createElement("div");
	this.inputDiv.id = "byu_sg_input_container";
	this.containerDiv.appendChild(this.inputDiv);

	var scriptHeader = document.createElement("h1");
	scriptHeader.id = "byu_sg_script_header";
	scriptHeader.appendChild(document.createTextNode("Job Script"));
	this.containerDiv.appendChild(scriptHeader);

	this.scriptFormatSelectorDiv = document.createElement("div");
	this.scriptFormatSelectorDiv.id = "byu_sg_script_format_selector_container";
	this.script_format_selector = this.newSelect({ options : this.settings.script_formats });
	this.script_format_selector.id = "byu_sg_script_format_selector";
	this.containerDiv.appendChild(this.newSpan("byu_sg_script_format_selector_container", "Script format:", this.script_format_selector));

	this.form = this.createForm();
	this.inputDiv.appendChild(this.form);

	this.jobNotesDiv = document.createElement("div");
	this.jobNotesDiv.id = "byu_sg_jobnotes";
	this.containerDiv.appendChild(this.jobNotesDiv);

	this.jobScriptDiv = document.createElement("div");
	this.jobScriptDiv.id = "byu_sg_jobscript";
	this.containerDiv.appendChild(this.jobScriptDiv);

	this.updateJobscript();
};

ScriptGen.prototype.toJobScript = function() {
	var schedformat = byu_sg_script_format_selector.options[byu_sg_script_format_selector.selectedIndex].value;
	var script;
	switch(schedformat) {
		case "slurm" :
			script = this.generateScriptSLURM();
			break;
		case "pbs" :
			script = this.generateScriptPBS();
			break;
	}
	this.jobScriptDiv.innerHTML = "<pre>" + script + "</pre>";
};
