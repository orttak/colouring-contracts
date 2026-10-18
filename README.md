# Colouring Contracts

A country-independent **building data contract** and an agent-assisted way to prepare local building data for the Colouring Cities / [GeoLibre](https://github.com/opengeos/GeoLibre) interface. Deliveries are packaged as a [Portolan](https://www.portolan-sdi.org/) catalog (GeoParquet, PMTiles, styles, metadata).

**Presentation:** https://orttak.github.io/colouring-contracts/

> **Status:** design decisions and draft notes only. No schemas, validators, pipelines or CLI are implemented yet.

## Documents

- [Building contract](docs/building-contract.md): canonical attributes, code lists, measurement rules, frontend behaviour (normative draft)
- [Tier 1 decisions](docs/tier1-decisions.md): what was decided, why, and on which evidence
- [Portolan decisions](docs/portolan-decisions.md): packaging, validation, pinned versions, publishing scope
- [Agent rules](AGENTS.md): how an agent inspects data and asks for approval
- `docs/superseded-*.md`: history only, do not follow

Raw data goes in `data/` (git-ignored; never uploaded automatically).

## License

[Apache License 2.0](LICENSE)
