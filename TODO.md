отлично! теперь создадим новую главу(глава 6). Давай реализуем это поэтапно, чтобы я протестировал каждый этап

Глава будет посвещена новой механике, которую нам нужно будет реализовать.
Добавь персонажа Николай, male age:1.

пока сделай сцену знакомства.

Мы будем интегрировать в игру варианты ответа с проверкой характеристик(харизма, коварство, решительность). У нас уже есть система характеристик и бонусов в персонаже, найди и используй их.
пока для примера мы будем тестировать вариант с проверкой на коварство, тэг у варианта ответа будет "[Коварство]".
 Мы реализуем систему броска кубиков с 20 гранями, которая предполагает выпавшее значение + бонус от характеристик(характеристики и бонусы уже должны храниться в персонаже).

для бросков должна быть указана сложность, результат броска предполагает 4 разные сцены результатов - для критического провала, провала, успеха, критического успеха.

пока нам нужно реализовать вариант с обманом, после выбора варианта с броском нужно показывать кубик, кнопку "бросить кубик". По нажатию будет происходить бросок кубика. По его результату будет показан результат и предложено:
1. продолжить
2. перебросить

сам кубик и бросок реализованы в E:\apps\android_games\love&roll\test_dice_mechanics.html

прежде чем создавать что-либо сначала посмотри на реализацию характеристик, других глав