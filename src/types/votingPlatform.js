/**
 * @typedef {Object} Proposal
 * @property {string} id - Unique identifier
 * @property {string} title - Proposal title
 * @property {string} content - Proposal content
 * @property {string} status - Current status (draft/active/completed/rejected)
 * @property {string} createdBy - Creator's ID
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} votingStartDate - Voting period start date
 * @property {Date} votingEndDate - Voting period end date
 * @property {number} currentVersion - Current version number
 */

/**
 * @typedef {Object} ProposalVersion
 * @property {string} id - Version ID
 * @property {string} proposalId - Reference to the main proposal
 * @property {number} versionNumber - Sequential version number
 * @property {string} content - Version content
 * @property {string} changeLog - Description of changes
 * @property {Date} createdAt - Version creation timestamp
 */

/**
 * @typedef {Object} Vote
 * @property {string} id - Vote ID
 * @property {string} proposalId - Reference to the proposal
 * @property {string} voterId - Voter's ID
 * @property {boolean} support - Whether the vote is in support
 * @property {number} votingPower - Voter's voting power
 * @property {string} [reason] - Optional voting reason
 * @property {Date} createdAt - Vote timestamp
 */

/**
 * @typedef {Object} Comment
 * @property {string} id - Comment ID
 * @property {string} proposalId - Reference to the proposal
 * @property {string} content - Comment content
 * @property {string} authorId - Comment author's ID
 * @property {Date} createdAt - Comment timestamp
 * @property {string} [parentId] - Optional reference to parent comment for replies
 */

/**
 * @typedef {Object} VotingResults
 * @property {string} proposalId - Reference to the proposal
 * @property {number} totalVotes - Total number of votes cast
 * @property {number} supportVotes - Number of supporting votes
 * @property {number} oppositionVotes - Number of opposing votes
 * @property {number} totalVotingPower - Total voting power cast
 * @property {number} supportVotingPower - Supporting voting power
 * @property {number} oppositionVotingPower - Opposing voting power
 */ 