# Github Filetree Visualizer

![example image](https://github.com/hanhee-song/github-visualizer/blob/master/docs/Screen%20Shot%202017-11-11%20at%2019.03.58.png?raw=true)

[Live Site](https://hanhee-song.github.io/project-visualizer/)

The Github Filetree Visualizer combines the D3 library with Github's API to create powerful visualizations of JavaScript-based repositories.

### Features

The visualizer will parse out the contents of any given repository, sift through all files with a ```.js``` or ```.jsx``` extension, and calculate the interdependencies based on the contents of the files.

Users can input either the Github URL or the user, repo, and an optional subdirectory. The visualizer will retrieve and display the files in a graph.

A node represents a file. The side of the node corresponds with the number of lines of code in the file. An arrow from one node to another represents an interdependency.

Users can double-click a node to highlight its links and display its contents, or double-click the same node to remove highlighting. Users can also click and drag nodes around.

![highlighting node example](https://github.com/hanhee-song/github-visualizer/blob/master/docs/Screen%20Shot%202017-11-11%20at%2019.04.29.png?raw=true)

#### How it works

The visualizer sends XHR requests via the Github API - one to retrieve the SHA of the most recent commit, one to retrieve the file tree, and a series of requests to retrieve the contents of every ```.js``` or ```.jsx``` file. It stores each file as a node and examines file dependencies to construct links between each file. Any line with an ```import``` or ```require``` statement is parsed into a link between the two files. The resulting JSON is then rendered in D3.

#### Notes

* The visualizer ignores any file named ```bundle```
* References to node modules or files outside of the specified subdirectory are ignored
* Colors are based on the subdirectory immediately following the specified directory. Higher specificity will result in more colorful graphs
* The subdirectory field takes in only one layer
