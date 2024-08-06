# aknewman
newman launcher with DNS spoofing and edgegrid credentials injection.

Not an "official" tool, no support provided, use at your own risks.

## Usage

Extra parameters are prefixed with `--ak` you can use regular newman arguments for the rest.

* `--ak-resolve` to force DNS resolution for a given host. Usage: `--ak-resolve=<host>:<ip>`
* `--ak-edgegrid` argument to inject values from .edgerc as `edgegrid_client_secret`, `edgegrid_host`, `edgegrid_access_token`, and `edgegrid_client_token` postman environment variables.


Running a collection with spoofing
```sh
aknewman --ak-resolve=www.example.org:1.2.3.4 run collection.json
```

Running a collection with spoofing and edgegrid credentials from `~/.edgerc` file
```sh
aknewman --ak-resolve=www.example.org:1.2.3.4 --ak-edgegrid run collection.json
```
