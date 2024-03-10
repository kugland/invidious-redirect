default:
    just --choose

# Build invidious-redirect.js for production
build:
    just _build_internal release invidious-redirect.js style.css

# Build invidious-redirect.js for staging
build-staging:
    just _build_internal staging invidious-redirect.js style.css

# Watch and build invidious-redirect-dev.js for development
watch:
    just _build_internal watch invidious-redirect-dev.js style-dev.css

_build_internal target js css:
    #!/usr/bin/env bash
    set -eu -o pipefail
    SASS_CMD=(sass "./css/style.scss:./css/{{ css }}")
    ESBUILD_CMD=(
        esbuild
        ./src/main.ts
        --bundle
        --tree-shaking=true
        --banner:js="$(cat header.js; echo -e '\n')"
        --loader:.png=dataurl --loader:.css=text --loader:.svg=text
        --outfile={{ js }}
    )

    case {{ target }} in
        "watch")
            SASS_CMD+=(--watch)
            ESBUILD_CMD+=(--watch)
            ESBUILD_CMD+=(--sourcemap)
            ESBUILD_CMD+=(--define:process.env.NODE_ENV=\"development\")
            ;;
        "staging")
            SASS_CMD+=(-s compressed --no-source-map)
            ESBUILD_CMD+=(--define:process.env.NODE_ENV=\"production\")
            ;;
        "release")
            SASS_CMD+=(-s compressed --no-source-map)
            ESBUILD_CMD+=(--define:process.env.NODE_ENV=\"production\")
            ESBUILD_CMD+=(--drop:console --drop:debugger)
            ;;
    esac

    set -x
    if [[ {{ target }} != "watch" ]]; then
        "${SASS_CMD[@]}"
    else
        "${SASS_CMD[@]}" &
        trap "echo 'Killing $! (sass)'; kill -KILL $!" EXIT
    fi

    "${ESBUILD_CMD[@]}"

# Update instances.json
update-instances:
    #!/usr/bin/env bash
    set -eu -o pipefail
    curl -sSL 'https://api.invidious.io/instances.json?pretty=0' \
        | jq -S 'map(select(.[0] | (contains(".onion") or contains("i2p")) | not))
                    | map({ (.[0]): (.[1].region + " " + .[1].flag) })
                    | add' \
        > instances.json

# Format code
fmt:
    #!/usr/bin/env bash
    set -eu -o pipefail
    just --unstable --fmt
    deno fmt --indent-width=4 --line-width=120 src/*.ts
    for json in *.json; do
        [[ $json == tsconfig.json ]] && continue
        jq . "$json" | sponge "$json"
    done

# Run nix-shell
[no-exit-message]
shell-nix:
    #!/usr/bin/env bash
    if which cached-nix-shell >/dev/null; then
        NIX_SHELL=cached-nix-shell
    else
        NIX_SHELL=nix-shell
    fi
    $NIX_SHELL --run "$SHELL"
