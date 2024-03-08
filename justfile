# Build invidious-redirect.js
build:
    cat header.txt > invidious-redirect.js
    esbuild invidious-redirect.ts --bundle >> invidious-redirect.js

# Update instances.json
update-instances:
    #!/usr/bin/env bash
    (
        echo -n 'export default '
        curl -sSL https://api.invidious.io/instances.json?pretty=0 \
            | jq -S 'map({ (.[0]): (.[1].region + " " + .[1].flag) }) | add'
    ) > instances.ts
