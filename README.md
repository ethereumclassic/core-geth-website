# Core-Geth

**an Ethereum Classic execution client**

Core-Geth is a production execution client for the Ethereum Classic network: the software that
holds the chain, validates every block and answers the JSON-RPC calls an application makes. It is a
go-ethereum downstream that keeps chain configuration as data rather than hard-coded, so one binary
serves Ethereum Classic, Mordor, MintMe and private chains.

**[coregeth.com](https://coregeth.com) · [Download](https://coregeth.com/downloads/) ·
[Documentation](https://docs.coregeth.com/) ·
[The client](https://github.com/ethereumclassic/core-geth)**

Running `geth` is running a
complete Ethereum Classic node: it finds peers, syncs the chain, validates every block it receives,
and serves the result to whatever you point at it.

```bash
# Run a node in a container, keeping the chain in a named volume
docker pull ghcr.io/ethereumclassic/core-geth:latest
docker run -d --name core-geth-classic \
    --restart unless-stopped --stop-timeout 300 \
    -v core-geth-classic:/root \
    -p 30303:30303 -p 30303:30303/udp \
    ghcr.io/ethereumclassic/core-geth:latest --classic
```

[Downloads](https://coregeth.com/downloads/) has the archive for every platform with its checksum
beside it, and the install and start commands for Linux, macOS, Windows and building from source.
The file names carry the release tag, which is why they are generated there rather than written
down here.

## Why it is maintained here

Core-Geth is a reference client for Ethereum Classic, kept as a public good in the
[`ethereumclassic`](https://github.com/ethereumclassic) GitHub organization, the same convention
[`bitcoin/bitcoin`](https://github.com/bitcoin/bitcoin) follows for Bitcoin and
[`ethereum/go-ethereum`](https://github.com/ethereum/go-ethereum) for Ethereum. It carries Ethereum
Classic's consensus rules itself, every fork from Frontier through Spiral, because go-ethereum does
not.

The `v1.12` line went 21 months without security maintenance in
[`etclabscore/core-geth`](https://github.com/etclabscore/core-geth), and an attack on the ETC
Cooperative's bootnodes in March 2026 used two of the flaws that gap left open. The `v1.13` line,
published here, closes all six the audits found.
[Security](https://coregeth.com/security/) carries the audits, what each release fixes, and a
count of which releases Ethereum Classic nodes are still running.
[About](https://coregeth.com/about/) carries the lineage, from go-ethereum through multi-geth, and
the organizations that have funded the work.

No part of the network's fee or issuance revenue pays for any of it.
[Sponsor](https://coregeth.com/sponsor/) says who maintains it, who has funded it, and how to
support it.

## This repository

This is the source for [coregeth.com](https://coregeth.com), the landing page above. None of the
client's code is here: that lives in
[`ethereumclassic/core-geth`](https://github.com/ethereumclassic/core-geth).

It is an [Astro](https://astro.build) site, static, with no client framework and no third-party
request on any page. `AGENTS.md` is the contract for working on it, and is worth reading before a
first change.

```bash
pnpm install --frozen-lockfile
pnpm dev            # http://localhost:4321
pnpm lint && pnpm format:check && pnpm build
```

Those three checks are the whole gate, and they are exactly what CI runs.

## License

This website is licensed under the [Apache License 2.0](LICENSE); see [NOTICE](NOTICE). Core-Geth
itself is separate work under its own license, the GNU GPL v3 and LGPL v3.
