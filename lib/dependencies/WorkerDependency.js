/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Ivan Kopeykin @vankop
*/

"use strict";

const RuntimeGlobals = require("../RuntimeGlobals");
const makeSerializable = require("../util/makeSerializable");
const ModuleDependency = require("./ModuleDependency");

/** @typedef {import("webpack-sources").ReplaceSource} ReplaceSource */
/** @typedef {import("../AsyncDependenciesBlock")} AsyncDependenciesBlock */
/** @typedef {import("../ChunkGraph")} ChunkGraph */
/** @typedef {import("../Dependency")} Dependency */
/** @typedef {import("../Dependency").UpdateHashContext} UpdateHashContext */
/** @typedef {import("../DependencyTemplate").DependencyTemplateContext} DependencyTemplateContext */
/** @typedef {import("../Entrypoint")} Entrypoint */
/** @typedef {import("../ModuleGraph")} ModuleGraph */
/** @typedef {import("../util/Hash")} Hash */

class WorkerDependency extends ModuleDependency {
	/**
	 * @param {string} request request
	 * @param {[number, number]} range range
	 */
	constructor(request, range) {
		super(request);
		this.range = range;
	}

	get type() {
		return "new Worker()";
	}

	get category() {
		return "esm";
	}
}

WorkerDependency.Template = class WorkerDependencyTemplate extends ModuleDependency.Template {
	/**
	 * @param {Dependency} dependency the dependency for which the template should be applied
	 * @param {ReplaceSource} source the current replace source which can be modified
	 * @param {DependencyTemplateContext} templateContext the context object
	 * @returns {void}
	 */
	apply(dependency, source, templateContext) {
		const { chunkGraph, moduleGraph, runtimeRequirements } = templateContext;
		const dep = /** @type {WorkerDependency} */ (dependency);
		const block = /** @type {AsyncDependenciesBlock} */ (moduleGraph.getParentBlock(
			dependency
		));
		const entrypoint = /** @type {Entrypoint} */ (chunkGraph.getBlockChunkGroup(
			block
		));
		const chunk = entrypoint.getEntrypointChunk();

		runtimeRequirements.add(RuntimeGlobals.publicPath);
		runtimeRequirements.add(RuntimeGlobals.baseURI);
		runtimeRequirements.add(RuntimeGlobals.getChunkScriptFilename);

		source.replace(
			dep.range[0],
			dep.range[1] - 1,
			`/* worker import */ ${RuntimeGlobals.publicPath} + ${
				RuntimeGlobals.getChunkScriptFilename
			}(${JSON.stringify(chunk.id)}), ${RuntimeGlobals.baseURI}`
		);
	}
};

makeSerializable(WorkerDependency, "webpack/lib/dependencies/WorkerDependency");

module.exports = WorkerDependency;
