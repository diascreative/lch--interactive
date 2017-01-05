# People's Power Station

![screenshot](https://cloud.githubusercontent.com/assets/293129/21677323/ea15e21e-d339-11e6-857e-980720eb3a8e.png)

This project was initially generated with the [Angular Full-Stack Generator](https://github.com/DaftMonk/generator-angular-fullstack) version 3.5.0.

## Getting Started

### Prerequisites

- [Git](https://git-scm.com/)
- [Node.js and npm](nodejs.org) Node ^4.2.3, npm ^2.14.7
- [Bower](bower.io) (`npm install --global bower`)
- [Grunt](http://gruntjs.com/) (`npm install --global grunt-cli`)
- [MySQL](https://www.mysql.com/)

### Developing

1. Run `npm install` to install server dependencies.

2. Run `bower install` to install front-end dependencies.

3. Run `grunt serve` to start the development server. It should automatically open the client in your browser when ready.

## Build & development

Run `grunt build` for building and `grunt serve` for preview.

1. Run `grunt serve:dist` to build and run the production-ready site.

2. run prerender for social sharing
```
$ git clone https://github.com/prerender/prerender.git
$ cd prerender
$ npm install
$ node server.js
```

this will run the prerenderer on `localhost:3000`

## TODO

* Testing

    Running `npm test` will run the unit tests with karma.
