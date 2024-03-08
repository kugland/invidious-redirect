type Instances = Record<string, string>;

function getStyle(): HTMLStyleElement {
    const style = document.createElement('style');
    style.textContent = `
        #invidious-instance-container {
            font-family: mono;
            font-size: 12px;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
            display: grid;
            place-content: center;
            z-index: 10000;
        }

        #invidious-instance-table {
            background-color: white;
            padding: 10px 15px;
            box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.5);
        }

        #invidious-instance-table td {
            padding-left: 10px;
        }

        #invidious-instance-table td:first-child {
            padding-left: 0;
        }

        #invidious-instance-table button {
            font-family: mono;
            font-size: 12px;
            padding: 4px 5px;
            border: none;
            background-color: #007bff;
            color: white;
            cursor: pointer;
        }

        #invidious-instance-table .selected {
            font-weight: bold;
        }
    `;
    return style;
}

function addProtocol(uri: string) {
    if (uri.startsWith('http'))
        return uri;
    else
        return `https://${uri}`;
}

declare const GM_xmlhttpRequest: {
    (details: {
        method: 'GET' | 'POST',
        headers: Record<string, string>,
        url: string,
        onload: (response: { responseText: string }) => void,
    }): void;
};

declare const GM: {
    xmlHttpRequest: typeof GM_xmlhttpRequest;
};

async function getInstances(): Promise<Instances> {
    const instancesLastUpdatedKey = 'invidious-redirect-instances-last-updated';
    const instancesKey = 'invidious-redirect-instances';
    const now = Date.now();
    const lastUpdated = parseInt(localStorage.getItem(instancesLastUpdatedKey) ?? "0");
    if (lastUpdated && (now - lastUpdated) < 86400000) {
        return JSON.parse(localStorage.getItem(instancesKey) as string);
    } else {
        const instances = await (new Promise((resolve) => {
            (GM.xmlHttpRequest || GM_xmlhttpRequest)({
                method: "GET",
                headers: { "Content-Type": "application/json" },
                url: "https://raw.githubusercontent.com/kugland/invidious-redirect/master/instances.json",
                onload: function(response) {
                    resolve(JSON.parse(response.responseText));
                }
            });
        })) as Instances;
        localStorage.setItem(instancesKey, JSON.stringify(instances));
        localStorage.setItem(instancesLastUpdatedKey, now.toString());
        return instances;
    }
}

async function getTable(current: string | null): Promise<string> {
    const instances = await getInstances();

    let sorted = Array.from(Object.keys(instances as Instances))
        .sort((a, b) => (instances[a] !== instances[b])
                            ? instances[a].localeCompare(instances[b])
                            : a.localeCompare(b))
        .map((uri) => [uri, instances[uri]] as const);

    return sorted
        .map(([uri, region]) => [uri, region] as const)
        .filter(([uri, ]) => !uri.endsWith('.i2p') && !uri.endsWith('.onion'))
        .map(([uri, region]) => {
            let url = addProtocol(uri);
            uri = uri.replace(/^https?:\/\//, '');
            return `
                <tr data-url="${url}" class=${current == url ? "selected" : ""}>
                    <td><a href="${url}" target="_blank">${uri}</a></td>
                    <td>${region.toLowerCase()}</td>
                    <td><button>select</button></td>
                </tr>
            `
        })
        .join('');
}

export async function showTable(current: string): Promise<string> {
    const table = document.createElement('div');
    table.id = 'invidious-instance-container';
    table.innerHTML = `<table id="invidious-instance-table">${await getTable(current)}</table>`;
    table.appendChild(getStyle());
    document.body.appendChild(table);
    return await (new Promise((resolve) => {
        table.querySelectorAll('button').forEach((button) => {
            button.addEventListener('click', (e) => {
                const tr = (e.target as HTMLButtonElement).closest('tr');
                if (tr) {
                    const url = tr.getAttribute('data-url');
                    if (url) {
                        table.remove();
                        resolve(url);
                    }
                }
            });
        });
    }));
}
