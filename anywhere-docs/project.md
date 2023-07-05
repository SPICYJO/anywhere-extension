Project Name: Anywhere

## Overview
- A software that lets you write and read comments on any website

## Features
- Read comments on the website
- Write comment on the website
- Authentication (required for writing a comment)
- View popular websites (to which most comments are added recently)

## Components

### Apps
- Chrome extension (for desktop browsers)
- Website (mainly for mobile browsers which doesn't have extension)
- Application server (serves comments)

### Infrastructures
- MongoDB (saves comments data)
- BigQuery (business insights and also for aggregation)
- GKE (k8s for managing application server)
- Apigee, KMS (maybe?)

## Timeline

- Project deadline
  - Jul 11 (TUE), 2023 @ 5:00pm EDT
  - Jul 10 (MON), 2023 @ 6:00am KST
- Project started on Jul 3 (MON), 2023 KST
- Timezone is in KST otherwise specified

- [ ] Jul 03 Application server
- [ ] Jul 04 Application server
- [ ] Jul 05 Application server
- [ ] Jul 06 Chrome extension
- [ ] Jul 07 Chrome extension
- [ ] Jul 08 Website
- [ ] Jul 09 Finish up & Demo video etc


## Spec

### How to handle URL?

URL is consisted of the following components.

scheme://domain:port/path?parameters#fragment

Let's define canonical URL format as below. Comments are shown according to the canonical URL. Pages with same canonical URL show the same comments and pages with different canonical URLs shows the different comments.

- scheme should be present
- domain should be present
- port part should be omitted when it matches with default port of the scheme, otherwise should be present
- path should be present.
- two urls are considered different with/without trailing slash in path
- parameters should be sorted by key name
- utm parameters should be removed from parameters (utm_source, utm_medium, utm_campaign, utm_term, utm_content)
- fragment part should be removed

Examples

- https://www.example.com:443 => https://www.example.com/
- https://www.example.com:440 => https://www.example.com:440/
- https://www.example.com/a/b => https://www.example.com/a/b
- https://www.example.com/a/b/ => https://www.example.com/a/b/
- https://www.example.com/a/b?d=3&c=4 => https://www.example.com/a/b?c=4&d=3
- https://www.example.com/a/b?d=3&c=4#anchor => https://www.example.com/a/b?c=4&d=3
- https://www.example.com/a/b?d=3&utm_source=4#anchor => https://www.example.com/a/b?d=3

