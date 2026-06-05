// TEMPORARY: intentionally failing test to prove CI blocks on test failures.
// This whole file gets deleted right after the demo.
describe('CI gate demo (e2e)', () => {
  it('fails on purpose so we can watch CI go red', () => {
    // arrange
    const expected = 5;

    // act
    const actual = 2 + 2;

    // assert
    expect(actual).toBe(expected); // 4 !== 5 → fails on purpose
  });
});
