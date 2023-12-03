npm run build
rm -r ../../Licode-Build/*
cp -a build/. ../../Licode-Build/
cd ../../Licode-Build
git add .
git commit -m "update"
git push origin master