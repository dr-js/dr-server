const pathContentStyle = `<style>
h2, h6 { margin: 0.5em 4px; }
.select, .directory, .file { display: flex; flex-flow: row nowrap; align-items: stretch; }
.directory:hover, .file:hover { background: #eee; }
.name { overflow:hidden; flex: 1; white-space:nowrap; text-align: left; text-overflow: ellipsis; background: transparent; }
.select .name, .file .name { pointer-events: none; color: #666; }
.edit { pointer-events: auto; min-width: 1.5em; min-height: auto; line-height: normal; }
</style>`

// TODO: add drag selection

const initPathContent = (
  URL_PATH_ACTION,
  URL_FILE_SERVE,
  IS_READ_ONLY = true,
  PATH_ACTION_TYPE,
  authFetch,
  withConfirmModal,
  withPromptModal
) => {
  const {
    qS, cE, aCL,
    Dr: { Common: { Format, Compare: { compareString } } }
  } = window

  const SORT_FUNC = { // ([ nameA, sizeA, mtimeMsA ], [ nameB, sizeB, mtimeMsB ]) => 0,
    NAME: ([ nameA ], [ nameB ]) => compareString(nameA, nameB),
    TIME: ([ , , mtimeMsA = 0 ], [ , , mtimeMsB = 0 ]) => mtimeMsB - mtimeMsA, // newer first
    SIZE: ([ , sizeA ], [ , sizeB ]) => sizeB - sizeA // bigger first
  }
  const SORT_TYPE_LIST = Object.keys(SORT_FUNC)

  const PATH_ROOT = '.'
  const pathPush = (relativePath, name) => relativePath === PATH_ROOT ? name : `${relativePath}/${name}`
  const pathPop = (relativePath) => relativePath === PATH_ROOT ? PATH_ROOT : relativePath.split('/').slice(0, -1).join('/')
  const pathName = (relativePath) => relativePath === PATH_ROOT ? '[ROOT]' : `${relativePath}/`

  const initialPathContentState = {
    pathSortType: SORT_TYPE_LIST[ 0 ],
    pathContent: {
      relativePath: PATH_ROOT,
      directoryList: [ /* name */ ],
      fileList: [ /* [ name, size, mtimeMs ] */ ]
    }
  }

  const authFetchPathAction = async (bodyObject) => (await authFetch(URL_PATH_ACTION, { method: 'POST', body: JSON.stringify(bodyObject) })).json()

  const cyclePathSortType = (pathContentStore, pathSortType = pathContentStore.getState().pathSortType) => {
    const nextSortIndex = (SORT_TYPE_LIST.indexOf(pathSortType) + 1) % SORT_TYPE_LIST.length
    pathContentStore.setState({ pathSortType: SORT_TYPE_LIST[ nextSortIndex ] })
  }

  const doLoadPath = async (pathContentStore, relativePath = pathContentStore.getState().pathContent.relativePath) => {
    const { resultList: [ { relativeFrom: nextRelativePath, directoryList, fileList } ] } = await authFetchPathAction({
      nameList: [ '' ], actionType: PATH_ACTION_TYPE.DIRECTORY_CONTENT, relativeFrom: relativePath || PATH_ROOT
    })
    pathContentStore.setState({ pathContent: { relativePath: nextRelativePath || PATH_ROOT, directoryList, fileList } })
  }

  const getLoadPathAsync = (pathContentStore) => async (relativePath) => doLoadPath(pathContentStore, relativePath)
  const getPathActionAsync = (pathContentStore) => async (nameList, actionType, relativeFrom, relativeTo) => {
    if (
      (actionType === PATH_ACTION_TYPE.PATH_MOVE || actionType === PATH_ACTION_TYPE.PATH_COPY) &&
      (!relativeTo || relativeTo === relativeFrom)
    ) return
    await authFetchPathAction({ nameList, actionType, relativeFrom, relativeTo })
    await doLoadPath(pathContentStore)
  }
  const getDownloadFileAsync = (pathContentStore, authDownload) => async (relativePath, fileName) => authDownload(
    `${URL_FILE_SERVE}/${encodeURIComponent(pathPush(relativePath, fileName))}`,
    fileName
  )

  const renderPathContent = (pathContentStore, parentElement, loadPath, pathAction, downloadFile) => {
    const { pathSortType, pathContent: { relativePath, directoryList, fileList } } = pathContentStore.getState()

    const selectToggleMap = {}
    const selectNameSet = new Set()

    const doSelectRemaining = () => {
      Object.entries(selectToggleMap).forEach(([ name, toggle ]) => !selectNameSet.has(name) && toggle())
      updateSelectStatus()
    }
    const doSelectNone = () => {
      selectNameSet.forEach((name) => selectToggleMap[ name ]())
      updateSelectStatus()
    }

    const TEXT_SELECT_NONE = '☐'
    const TEXT_SELECT_SOME = '☒'
    const TEXT_SELECT_ALL = '☑'
    const TEXT_BATCH = (text) => `🗃️${text}`

    const TEXT_CUT = '✂️'
    const TEXT_COPY = '📋'
    const TEXT_DELETE = '🗑️'

    const selectEditSelectNone = cE('button', { className: 'edit', innerText: TEXT_BATCH(TEXT_SELECT_NONE), onclick: doSelectRemaining })
    const selectEditSelectSome = cE('button', { className: 'edit', innerText: TEXT_BATCH(TEXT_SELECT_SOME), onclick: doSelectRemaining })
    const selectEditSelectAll = cE('button', { className: 'edit', innerText: TEXT_BATCH(TEXT_SELECT_ALL), onclick: doSelectNone })

    const selectEditMove = cE('button', { className: 'edit', innerText: TEXT_BATCH(TEXT_CUT), onclick: async () => pathAction([ ...selectNameSet ], PATH_ACTION_TYPE.PATH_MOVE, relativePath, await withPromptModal(`Batch Move ${selectNameSet.size} Path To`, relativePath)) })
    const selectEditCopy = cE('button', { className: 'edit', innerText: TEXT_BATCH(TEXT_COPY), onclick: async () => pathAction([ ...selectNameSet ], PATH_ACTION_TYPE.PATH_COPY, relativePath, await withPromptModal(`Batch Copy ${selectNameSet.size} Path To`, relativePath)) })
    const selectEditDelete = cE('button', { className: 'edit', innerText: TEXT_BATCH(TEXT_DELETE), onclick: async () => (await withConfirmModal(`Batch Delete ${selectNameSet.size} Path In: ${pathName(relativePath)}?`)) && pathAction([ ...selectNameSet ], PATH_ACTION_TYPE.PATH_DELETE, relativePath) })

    const updateSelectStatus = () => aCL(qS('.select', ''), [
      !selectNameSet.size ? selectEditSelectNone : (selectNameSet.size < (directoryList.length + fileList.length)) ? selectEditSelectSome : selectEditSelectAll,
      selectNameSet.size && selectEditMove,
      selectNameSet.size && selectEditCopy,
      selectNameSet.size && selectEditDelete,
      cE('span', { className: 'name button', innerText: `${selectNameSet.size} selected` })
    ])

    const renderSelectButton = (name) => {
      selectToggleMap[ name ] = () => { // toggle select func
        const prevIsSelect = selectNameSet.has(name)
        selectNameSet[ prevIsSelect ? 'delete' : 'add' ](name)
        const isSelect = !prevIsSelect
        element.className = isSelect ? 'edit select' : 'edit'
        element.innerText = isSelect ? TEXT_SELECT_ALL : TEXT_SELECT_NONE
      }
      const element = cE('button', {
        className: 'edit',
        innerText: TEXT_SELECT_NONE,
        onclick: () => {
          selectToggleMap[ name ]()
          updateSelectStatus()
        }
      })
      return element
    }

    const renderCommonEditList = (relativePath) => (IS_READ_ONLY || (window.innerWidth <= 480)) ? [] : [
      cE('button', { className: 'edit', innerText: TEXT_CUT, onclick: async () => pathAction([ '' ], PATH_ACTION_TYPE.PATH_MOVE, relativePath, await withPromptModal('Move To', relativePath)) }),
      cE('button', { className: 'edit', innerText: TEXT_COPY, onclick: async () => pathAction([ '' ], PATH_ACTION_TYPE.PATH_COPY, relativePath, await withPromptModal('Copy To', relativePath)) }),
      cE('button', { className: 'edit', innerText: TEXT_DELETE, onclick: async () => (await withConfirmModal(`Delete path: ${relativePath}?`)) && pathAction([ '' ], PATH_ACTION_TYPE.PATH_DELETE, relativePath) })
    ]

    parentElement.innerHTML = ''

    aCL(parentElement, [
      cE('h2', { innerText: pathName(relativePath) }),
      cE('h6', { innerText: `${directoryList.length} directory, ${fileList.length} file (${Format.binary(fileList.reduce((o, [ , size ]) => o + size, 0))}B)` }),
      relativePath !== PATH_ROOT && cE('div', { className: 'directory' }, [
        cE('button', { className: 'name', innerText: '🔙|..', onclick: () => loadPath(pathPop(relativePath)) })
      ]),
      !IS_READ_ONLY && cE('div', { className: 'select' }),
      ...directoryList
        .sort((nameA, nameB) => SORT_FUNC[ pathSortType ]([ nameA ], [ nameB ]))
        .map((name) => cE('div', { className: 'directory' }, [
          !IS_READ_ONLY && renderSelectButton(name),
          cE('button', { className: 'name', innerText: `📁|${name}/`, onclick: () => loadPath(pathPush(relativePath, name)) }),
          ...renderCommonEditList(pathPush(relativePath, name))
        ])),
      ...fileList
        .sort(SORT_FUNC[ pathSortType ])
        .map(([ name, size, mtimeMs ]) => cE('div', { className: 'file' }, [
          !IS_READ_ONLY && renderSelectButton(name),
          cE('span', { className: 'name button', innerText: `📄|${name} - ${new Date(mtimeMs).toLocaleString()}` }),
          cE('button', { className: 'edit', innerText: `${Format.binary(size)}B|💾`, onclick: () => downloadFile(relativePath, name) }),
          ...renderCommonEditList(pathPush(relativePath, name))
        ]))
    ])

    !IS_READ_ONLY && updateSelectStatus()
  }

  return {
    initialPathContentState,
    cyclePathSortType,
    getLoadPathAsync,
    getPathActionAsync,
    getDownloadFileAsync,
    renderPathContent
  }
}

export { pathContentStyle, initPathContent }
