#!/bin/bash
#pushd chrome/chromeFiles
#zip -r vocab.jar content/ skin/
#popd
zip vocab.xpi install.rdf chrome.manifest chrome/chromeFiles/* -r
#rm chrome/chromeFiles/vocab.jar
