function privateGetPage(pageNumber) {
  if (pageNumber < 1 || pageNumber > this.numberOfPages) {
    return {
      header: {
        error: 'page does not exist',
      },
    };
  }

  const hasNextPage = pageNumber < this.numberOfPages;
  return {
    header: {
      pageNumber,
      hasNextPage,
    },
    data: {
    },
  };
}

class Client {
  constructor(numberOfPages) {
    this.numberOfPages = numberOfPages;
  }

  getPage(pageNumber, pageIsAvailable) {
    const delay = Math.random() * 1000;
    setTimeout(() => {
      const response = privateGetPage.bind(this)(pageNumber);
      pageIsAvailable(response);
    }, delay);
  }
}

module.exports = Client;
