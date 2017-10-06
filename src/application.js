
function fetchAllPages(client, allPagesAreAvailable) {
  const responses = [];
  function fetchAndProcessPage(pageNumber) {
    client.getPage(pageNumber, (response) => {
      responses.push(response);
      if (response.header.hasNextPage) {
        fetchAndProcessPage(pageNumber + 1);
      } else {
        allPagesAreAvailable(responses);
      }
    });
  }
  fetchAndProcessPage(1);
}

module.exports = {
  fetchAllPages,
};
