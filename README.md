<!-- [![NPM version][npm-version-image]][npm-url]
[![NPM downloads per month][npm-downloads-month-image]][npm-url]
[![NPM downloads total][npm-downloads-total-image]][npm-url]
[![MIT License][license-image]][license-url] -->

# YouSolution.Cloud nodes for Node-RED.

[![Platform](https://img.shields.io/badge/platform-Node--RED-red)](https://nodered.org)

This module provides a set of nodes for Node-RED to quickly create integration flows with YouSolution.Cloud iPaaS.

# Installation

[![NPM](https://nodei.co/npm/node-red-contrib-you-yousolution.cloud.png?downloads=true)](https://nodei.co/npm/node-red-contrib-you-yousolution.cloud/)

You can install the nodes using node-red's "Manage palette" in the side bar.

Or run the following command in the root directory of your Node-RED installation

    npm install @yousolution/node-red-contrib-you-yousolution.cloud --save

# Dependencies

The nodes are tested with `Node.js v12.22.6` and `Node-RED v2.0.6`.

- [axios](https://github.com/axios/axios)

# Changelog

Changes can be followed [here](/CHANGELOG.md).

# Usage

## Basics

### Overview iPaaS YouSolution.Cloud

To understand how the Yousolution integration platform works [see this link](https://docs.yousolution.cloud/)

### Producer (node producer)

This node is used to send the message you want to integrate to the platform.

### Consumer (node consumer)

This node is used to receive the message you want to integrate from the platform.
