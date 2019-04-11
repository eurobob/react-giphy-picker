import React, { Component } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import "whatwg-fetch";
import InfiniteScroll from "react-infinite-scroller";

Array.prototype.chunk = function(groupsize) {
  var sets = [],
    chunks,
    i = 0;
  chunks = this.length / groupsize;

  while (i < chunks) {
    sets[i] = this.splice(0, groupsize);
    i++;
  }

  return sets;
};

Array.prototype.clone = function() {
  return this.slice(0);
};

function debounce(fn, delay) {
  var timer = null;
  return function() {
    var context = this,
      args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function() {
      fn.apply(context, args);
    }, delay);
  };
}

export default class extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gifs: [],
      searchValue: "",
      loading: false,
      focused: false,
      hasMore: true,
      giphySearchUrl: `https://api.giphy.com/v1/gifs/search?api_key=${
        this.props.apiKey
      }`,
      giphyTrendingUrl: `https://api.giphy.com/v1/gifs/trending?api_key=${
        this.props.apiKey
      }`,
      page: 0
    };

    this.searchGifs = debounce(this.searchGifs, 500);
  }

  static get propTypes() {
    return {
      onSelected: PropTypes.func.isRequired,
      apiKey: PropTypes.string,
      loader: PropTypes.element,
      placeholder: PropTypes.string,
      imagePlaceholderColor: PropTypes.string,
      inputClassName: PropTypes.string,
      children: PropTypes.element
    };
  }

  static get defaultProps() {
    return {
      apiKey: "dc6zaTOxFJmzC",
      placeholder: "Search for GIFs",
      imagePlaceholderColor: "#E3E3E3",
      loader: <p>Loading...</p>
    };
  }

  componentDidMount() {
    this.searchGifs();
  }

  searchGifs = offset => {
    const { giphySearchUrl, searchValue, page, loading } = this.state;
    const { placeholder } = this.props;
    if (searchValue.length < 1 && placeholder.length < 1) {
      return;
    }
    if (loading) {
      return;
    }
    let query = "";
    if (searchValue.length >= 1) {
      query = searchValue.replace(" ", "+");
    } else if (placeholder.length >= 1) {
      query = placeholder.replace(" ", "+");
    }

    let url = giphySearchUrl + "&q=" + query;
    if (offset) {
      url += "&offset=" + offset;
    }

    this.setState({
      loading: true
    });
    fetch(url, {
      method: "get"
    })
      .then(res => res.json())
      .then(response => {
        let gifs = response.data.map(g => g.images);
        let hasMore = true;
        const { total_count, count, offset } = response.pagination;
        if (total_count <= count + offset) {
          hasMore = false;
        }

        this.setState({
          gifs: this.state.gifs.concat(gifs),
          page: page + 1,
          loading: false,
          hasMore: hasMore
        });
      });
  };

  onGiphySelect = gif => {
    this.props.onSelected(gif);
  };

  onSearchChange = event => {
    let value = event.target.value;
    event.stopPropagation();
    this.setState({
      searchValue: value,
      page: 0,
      gifs: []
    });
    this.searchGifs();
  };

  onKeyDown = event => {
    if (event.key === "Escape") {
      event.preventDefault();
      this.reset();
    }
  };

  reset = () => {
    this.setState({ searchValue: "" });
  };

  loadMore = () => {
    const { searchValue, page } = this.state;
    let nextPage = page + 1;
    let offset = (Number(nextPage) - 1) * 25;
    this.searchGifs(offset);
  };

  focusToggle = focused => {
    this.setState({
      focused
    });
  };

  render() {
    const { gifs, loading, hasMore } = this.state;
    const rowChunks = gifs.clone().chunk(9);
    return (
      <Wrapper>
        <GiphyPickerWrapper className={"giphy-picker"}>
          <Input
            name="giphy-search"
            type="text"
            className={this.props.inputClassName}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            onChange={this.onSearchChange}
            value={this.state.searchValue}
            onKeyDown={this.onKeyDown}
            placeholder={this.props.placeholder}
            onFocus={() => this.focusToggle(true)}
            onBlur={() => this.focusToggle(false)}
          />
          <GiphyWrapper modal={this.props.modal} visible={this.state.focused}>
            <InfiniteScroll
              loadMore={this.loadMore}
              hasMore={!loading && hasMore}
              initialLoad={false}
              useWindow={false}
              threshold={700}
            >
              {!rowChunks.length && loading && this.props.loader}
              <GiphyWrapperRow>
                {rowChunks.map((gifs, i) => {
                  return (
                    <GiphyColumn key={i}>
                      {gifs.map((g, j) => {
                        let gifUrl = g.fixed_width.url;
                        return (
                          <Giphy
                            key={j}
                            style={{
                              width: "100%",
                              // height: Number(g.fixed_width.height),
                              backgroundColor: this.props.imagePlaceholderColor
                            }}
                            src={gifUrl}
                            onClick={() => {
                              console.log(g);
                              this.onGiphySelect(g);
                            }}
                          />
                        );
                      })}
                    </GiphyColumn>
                  );
                })}
              </GiphyWrapperRow>
            </InfiniteScroll>
          </GiphyWrapper>
        </GiphyPickerWrapper>
        {this.props.children}
      </Wrapper>
    );
  }
}

const Wrapper = styled.div`
  box-sizing: border-box;
  position: relative;
`;

const GiphyPickerWrapper = styled.div`
  box-sizing: border-box;
  position: relative;
  padding: 10px;
  border: 1px solid #f1f1f1;
  border-radius: 4px;
  background: white;
  width: 100%;
  max-width: 420px;
`;

const GiphyWrapper = styled.div`
  box-sizing: border-box;
  overflow-y: scroll;
  height: 300px;
  width: 100%;
  max-width: 420px;
  left: -1px;
  margin-top: 5px;
  background: #fff;
  border: 1px solid #f1f1f1;
  border-top: none;
  z-index: 99;
  position: ${({ modal }) => (modal ? "absolute" : "relative")};
  display: ${({ visible }) => (visible ? "block" : "none")};
`;

const GiphyWrapperRow = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  padding: 0 4px;
`;

const GiphyColumn = styled.div`
  box-sizing: border-box;
  flex: 50%;
  max-width: 50%;
  padding: 0 4px;
  cursor: pointer;
`;

const Giphy = styled.img`
  border-radius: 3px;
  margin-top: 8px;
  box-sizing: border-box;
  vertical-align: middle;
`;

const Input = styled.input`
  background-color: transparent;
  border: 1px solid #ddd;
  border-radius: 2px;
  color: inherit;
  font-size: 14px;
  height: auto;
  line-height: 1;
  margin: 0;
  padding: 7px 10px;
  width: 100%;
  display: block;
  &:focus {
    outline: none;
  }
`;
