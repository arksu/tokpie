import assertRevert from './helpers/assertRevert';

const MintableToken = artifacts.require('MintableToken');

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract('MintableToken', function (accounts) {
    const owner = accounts[0];
    const anotherAccount = accounts[1];
    const saleAgent = accounts[2];

    beforeEach(async function () {
        this.token = await MintableToken.new({ from: owner });
    });

    describe('minting finished', function () {
        describe('when the token is not finished', function () {
            it('returns false', async function () {
                const mintingFinished = await this.token.mintingFinished();
                assert.equal(mintingFinished, false);
            });
        });

        describe('when the token is finished', function () {
            beforeEach(async function () {
                await this.token.setSaleAgent(saleAgent);
                await this.token.finishMinting({ from: saleAgent });
            });

            it('returns true', async function () {
                const mintingFinished = await this.token.mintingFinished.call();
                assert.equal(mintingFinished, true);
            });
        });
    });

    describe('finish minting', function () {
        describe('when the sender is the token owner', function () {
            const from = owner;

            beforeEach(async function () {
                await this.token.setSaleAgent(from);
            });

            describe('when the token was not finished', function () {
                it('finishes token minting', async function () {
                    await this.token.finishMinting({ from });

                    const mintingFinished = await this.token.mintingFinished();
                    assert.equal(mintingFinished, true);
                });

                it('emits a mint finished event', async function () {
                    const { logs } = await this.token.finishMinting({ from });

                    assert.equal(logs.length, 1);
                    assert.equal(logs[0].event, 'MintFinished');
                });
            });

            describe('when the token was already finished', function () {
                it('reverts', async function () {
                    await this.token.finishMinting({ from });
                    await assertRevert(this.token.finishMinting({ from }));
                });
            });
        });

        describe('when the sender is not the token owner', function () {
            const from = anotherAccount;

            beforeEach(async function () {
                await this.token.setSaleAgent(saleAgent);
            });

            describe('when the token was not finished', function () {
                it('reverts', async function () {
                    await assertRevert(this.token.finishMinting({ from }));
                });
            });

            describe('when the token was already finished', function () {
                it('reverts', async function () {
                    await this.token.finishMinting({ from: saleAgent });
                    await assertRevert(this.token.finishMinting({ from }));
                });
            });
        });
    });

    describe('mint', function () {
        const amount = 100;

        beforeEach(async function () {
            await this.token.setSaleAgent(owner);
        });

        describe('when the sender is the token owner', function () {
            const from = owner;

            describe('when the token was not finished', function () {
                it('mints the requested amount', async function () {
                    await this.token.mint(owner, amount, { from });

                    const balance = await this.token.balanceOf(owner);
                    assert.equal(balance, amount);
                });

                it('emits a mint finished event', async function () {
                    const { logs } = await this.token.mint(owner, amount, { from });

                    assert.equal(logs.length, 2);
                    assert.equal(logs[0].event, 'Mint');
                    assert.equal(logs[0].args.to, owner);
                    assert.equal(logs[0].args.amount, amount);
                    assert.equal(logs[1].event, 'Transfer');
                });
            });

            describe('when the token minting is finished', function () {
                beforeEach(async function () {
                    await this.token.finishMinting({ from });
                });

                it('reverts', async function () {
                    await assertRevert(this.token.mint(owner, amount, { from }));
                });
            });
        });

        describe('when the sender is not the token owner', function () {
            const from = anotherAccount;

            describe('when the token was not finished', function () {
                it('reverts', async function () {
                    await assertRevert(this.token.mint(owner, amount, { from }));
                });
            });

            describe('when the token was already finished', function () {
                beforeEach(async function () {
                    await this.token.finishMinting({ from: owner });
                });

                it('reverts', async function () {
                    await assertRevert(this.token.mint(owner, amount, { from }));
                });
            });
        });
    });
});
