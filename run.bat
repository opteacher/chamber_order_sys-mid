git init
rd "lib/frontend-library"
git submodule add https://github.com/opteacher/frontend-library.git lib/frontend-library
npm install --registry https://registry.npmmirror.com/
npm run dev