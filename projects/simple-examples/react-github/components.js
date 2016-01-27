var RepoBox = React.createClass({
    displayName: "RepoBox",

    render: function () {
        return React.createElement(
            "div",
            { className: "form-group" },
            React.createElement(
                "label",
                { htmlFor: "repoInput" },
                "User/Repository"
            ),
            React.createElement("input", { id: "repoInput", type: "text", className: "form-control", placeholder: "facebook/react", onChange: this.props.onChange, value: this.props.value })
        );
    }
});

var BranchSelector = React.createClass({
    displayName: "BranchSelector",

    render: function () {
        var branchesArr = [];
        for (var i = 0; i < this.props.branches.length; i++) branchesArr.push(React.createElement(
            "option",
            { key: this.props.branches[i].name, defaultValue: this.props.branches[i].name },
            this.props.branches[i].name
        ));

        return React.createElement(
            "div",
            { className: "form-group" },
            React.createElement(
                "label",
                { htmlFor: "branchSelector" },
                "Branch"
            ),
            React.createElement(
                "select",
                { id: "branchSelector", className: "form-control", value: this.props.value, onChange: this.onChange },
                branchesArr
            )
        );
    },

    onChange: function (event) {
        this.props.onChange(event.target.value);
    }
});

var APIStatusComponent = React.createClass({
    displayName: "APIStatusComponent",

    render: function () {
        var timeStr = new Date(this.props.resetTime).toLocaleTimeString();

        return React.createElement(
            "p",
            { className: "small" },
            "API calls remaining: ",
            this.props.remaining,
            " (resets at ",
            timeStr,
            ")"
        );
    }
});

var Commit = React.createClass({
    displayName: "Commit",

    render: function () {
        return React.createElement(
            "li",
            null,
            this.props.commit.commit.message
        );
    }
});

var CommitList = React.createClass({
    displayName: "CommitList",

    render: function () {
        var commitsArr = [];
        for (var i = 0; i < this.props.commits.length; i++) commitsArr.push(React.createElement(Commit, { commit: this.props.commits[i], key: this.props.commits[i].sha }));

        return React.createElement(
            "ul",
            null,
            commitsArr
        );
    }
});

var CommitsComponent = React.createClass({
    displayName: "CommitsComponent",

    render: function () {
        return React.createElement(
            "div",
            null,
            React.createElement(RepoBox, { id: "repoBox", onChange: this.repoChange, value: this.state.repo }),
            React.createElement(BranchSelector, { onChange: this.branchChange, branches: this.state.branches, value: this.state.branch }),
            React.createElement(APIStatusComponent, { remaining: this.state.apiRemaining, resetTime: this.state.apiReset }),
            React.createElement(CommitList, { commits: this.state.commits })
        );
    },

    componentDidMount: function () {
        this.getCommits(false);
        this.getBranches();
    },

    getInitialState: function () {
        return { commits: [], branches: [], branch: 'master', repo: 'facebook/react', commitTimeout: null, branchTimeout: null, apiRemaining: 60, apiReset: Date.now() };
    },

    getCommits: function (skipTimeouts, newBranch) {
        var branch = newBranch ? newBranch : this.state.branch;

        if (skipTimeouts) {
            $.get('https://api.github.com/repos/' + this.state.repo + '/commits?sha=' + branch, (data, textStatus, request) => {
                this.setState({ 'commits': data, 'apiRemaining': request.getResponseHeader('X-RateLimit-Remaining'), 'apiReset': parseInt(request.getResponseHeader('X-RateLimit-Reset')) * 1000 });
            }).fail(response => this.setState({ 'apiRemaining': request.getResponseHeader('X-RateLimit-Remaining'), 'apiReset': parseInt(request.getResponseHeader('X-RateLimit-Reset')) * 1000 }));
        } else {
            var timeout = setTimeout(function () {
                $.get('https://api.github.com/repos/' + this.state.repo + '/commits?sha=' + branch, (data, textStatus, request) => this.setState({ commits: data, 'apiRemaining': request.getResponseHeader('X-RateLimit-Remaining'), 'apiReset': parseInt(request.getResponseHeader('X-RateLimit-Reset')) * 1000 })).fail(response => this.setState({ 'apiRemaining': response.getResponseHeader('X-RateLimit-Remaining'), 'apiReset': parseInt(response.getResponseHeader('X-RateLimit-Reset')) * 1000 }));
                this.setState({ 'commitTimeout': null });
            }.bind(this), 1000);
        }

        this.setState({ 'commitTimeout': timeout });
    },

    getBranches: function () {
        var timeout = setTimeout(function () {
            $.get('https://api.github.com/repos/' + this.state.repo + '/branches', data => this.setState({ 'branches': data }));
            this.setState({ 'branchTimeout': null });
        }.bind(this), 1000);

        this.setState({ 'branchTimeout': timeout });
    },

    repoChange: function (event) {
        this.stopTimeouts();
        this.setState({ 'repo': event.target.value });
        this.getCommits(false);
        this.getBranches();
    },

    branchChange: function (branch) {
        this.stopTimeouts();
        this.setState({ 'branch': branch });
        this.getCommits(true, branch);
    },

    stopTimeouts: function () {
        clearTimeout(this.state.commitTimeout);
        clearTimeout(this.state.branchTimeout);
        this.setState({ 'commitTimeout': null, 'branchTimeout': null });
    }
});

jQuery(function () {
    ReactDOM.render(React.createElement(CommitsComponent, null), document.getElementById('container'));
});
