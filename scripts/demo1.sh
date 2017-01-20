#!/usr/bin/env bash
# Transloadit. Copyright (c) 2017, Transloadit Ltd.
#
# Authors:
#
#  - Kevin van Zonneveld <kevin@transloadit.com>

set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

# Set magic variables for current FILE & DIR
__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
__file="${__dir}/$(basename "${BASH_SOURCE[0]}")"
__base="$(basename ${__file} .sh)"

type asciinema || brew install asciinema
type asciinema2gif || brew install asciinema2gif

cat <<-EOF

  # preparation
  pushd ~/code/node-sdk
    git reset --hard
    git clean -fd
    git checkout master
  popd

  # demo script
  yarn global add invig@0.0.9
  cd ~/code/node-sdk
  vim src/PaginationStream.coffee
  invig --src ./PaginationStream.coffee
  vim src/PaginationStream.js

EOF

asciinema rec -t "Invig - ${__base}"

echo ""
read -p "If you uploaded the demo, you should now make it public, and then type the ID here (e.g. 100025)" asciiID

asciinema2gif --theme monokai -o "${__dir}/${__base}.gif" "${asciiID}"
