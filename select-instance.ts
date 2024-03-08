import instances from './instances.js';

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

function getTable(current: string | null): string {
    let sorted = Array.from(Object.keys(instances as Instances)).sort((a, b) => {
        const region_a = instances[a];
        const region_b = instances[b];
        if (region_a !== region_b)
            return region_a.localeCompare(region_b);
        else
            return a.localeCompare(b);
    }).map((uri) => [uri, instances[uri]] as const);

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

export function showTable(current: string): Promise<string> {
    const table = document.createElement('div');
    table.id = 'invidious-instance-container';
    table.innerHTML = `<table id="invidious-instance-table">${getTable(current)}</table>`;
    table.appendChild(getStyle());
    document.body.appendChild(table);
    return new Promise((resolve) => {
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
    });
}
