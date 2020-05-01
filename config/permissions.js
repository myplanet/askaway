module.exports = [
  {
    'name': 'host',
    'checkId': 1,
    'permissions': [
      {
        'name': 'end-room',
        'allow': true
      },
      {
        'name': 'mod-cohost',
        'allow': true
      },
      {
        'name': 'edit-room',
        'allow': true
      },
      {
        'name': 'export',
        'allow': true
      },
      {
        'name': 'answer-question',
        'allow': true
      },
      {
        'name': 'presentation-mode',
        'allow': true
      }
    ]
  },
  {
    'name': 'cohost',
    'checkId': 2,
    'permissions': [
      {
        'name': 'edit-room',
        'allow': true
      },
      {
        'name': 'export',
        'allow': true
      },
      {
        'name': 'answer-question',
        'allow': true
      },
      {
        'name': 'presentation-mode',
        'allow': true
      }
    ]
  }
]
