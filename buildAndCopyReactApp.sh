#~/bin/bash

cd react-app
npm run build
cd -
scp -r react-app licode@licode.io:licode

